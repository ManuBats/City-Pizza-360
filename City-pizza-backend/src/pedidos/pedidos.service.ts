import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EstadoPedido } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './pedido.dto';

/** Máquina de estados: Recibido→Preparación→Listo→En Camino→Entregado. 400 si inválida. */
export const SIGUIENTE_ESTADO: Record<EstadoPedido, EstadoPedido | null> = {
  Recibido: 'Preparacion',
  Preparacion: 'Listo',
  Listo: 'EnCamino',
  EnCamino: 'Entregado',
  Entregado: null,
};

function codigoPedido(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `CP360-${n}`;
}

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /pedidos (sin token). Todo o nada: pedido + detalle + stock. */
  async crear(dto: CreatePedidoDto) {
    const pizzas = await this.prisma.pizza.findMany({
      where: { id: { in: dto.items.map((i) => i.pizzaId) } },
      include: { insumos: { include: { insumo: true } } },
    });
    if (pizzas.length !== dto.items.length)
      throw new BadRequestException('Alguna pizza no existe');

    for (const item of dto.items) {
      const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
      if (!pizza.disponible) throw new BadRequestException(`${pizza.nombre} está agotada`);
      // Regla negocio: sin queso no hay Hawaiana
      if (/hawaiana/i.test(pizza.nombre)) {
        const queso = pizza.insumos.find((pi) => /queso/i.test(pi.insumo.nombre));
        if (queso && queso.insumo.stock < queso.cantidad * item.cantidad)
          throw new BadRequestException('Sin queso no hay Hawaiana');
      }
    }

    // El total lo calcula el servidor (precio base × cantidad).
    const total = dto.items.reduce((acc, item) => {
      const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
      return acc + Number(pizza.precio) * item.cantidad;
    }, 0);

    let codigo = codigoPedido();
    for (let i = 0; i < 5; i++) {
      const existe = await this.prisma.pedido.findUnique({ where: { codigo } });
      if (!existe) break;
      codigo = codigoPedido();
    }

    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          codigo,
          nombres: dto.nombres.trim(),
          apellidos: dto.apellidos.trim(),
          celular: dto.celular,
          direccion: dto.direccion.trim(),
          referencia: dto.referencia?.trim() || null,
          total,
        },
      });
      for (const item of dto.items) {
        const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
        await tx.detallePedido.create({
          data: {
            pedidoId: pedido.id,
            pizzaId: pizza.id,
            cantidad: item.cantidad,
            precioUnit: pizza.precio,
          },
        });
        for (const pi of pizza.insumos) {
          await tx.insumo.update({
            where: { id: pi.insumoId },
            data: { stock: { decrement: pi.cantidad * item.cantidad } },
          });
        }
      }
      return tx.pedido.findUniqueOrThrow({
        where: { id: pedido.id },
        include: { detalles: { include: { pizza: true } } },
      });
    });
  }

  /** Tracking invitado por código + celular. */
  async tracking(codigo: string, celular: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { codigo },
      include: { detalles: { include: { pizza: true } } },
    });
    if (!pedido || pedido.celular !== celular)
      throw new NotFoundException('Pedido no encontrado');
    return pedido;
  }

  /** Avance de estado con máquina estricta (JWT rol). */
  async cambiarEstado(id: number, estado: EstadoPedido) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (SIGUIENTE_ESTADO[pedido.estado] !== estado)
      throw new BadRequestException(
        `Transición inválida: ${pedido.estado} → ${estado}`,
      );
    return this.prisma.pedido.update({ where: { id }, data: { estado } });
  }

  findAll() {
    return this.prisma.pedido.findMany({
      orderBy: { creadoEn: 'desc' },
      include: { detalles: { include: { pizza: true } } },
    });
  }
}

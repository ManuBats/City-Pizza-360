import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EstadoPago, EstadoPedido } from '@prisma/client';
import { precioLinea, type Tamano } from '../../../utils/precios';
import { COSTO_DELIVERY } from '../../../constants/negocio.constants';
import { serializarPedido } from '../../../utils/serializar';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreatePedidoDto } from '../dto/pedido.dto';

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

export type RecetaInsumo = {
  insumoId: number;
  insumoNombre: string;
  stock: number;
  cantidad: number;
};

export type PizzaConReceta = {
  id: number;
  nombre: string;
  insumos: RecetaInsumo[];
};

export type ItemAValidar = {
  pizzaId: number;
  nombrePizza: string;
  cantidad: number;
};

/**
 * Regla general: sin stock no hay venta. Vale para todas las pizzas,
 * incluidas las que se creen a futuro (revisa su receta, no su nombre).
 * Retorna el mensaje de error o null si hay stock suficiente.
 * El caso emblema conserva su mensaje: sin queso no hay Hawaiana.
 */
export function faltaStock(
  pizzas: PizzaConReceta[],
  items: ItemAValidar[],
): string | null {
  for (const item of items) {
    const pizza = pizzas.find((p) => p.id === item.pizzaId);
    if (!pizza) continue;
    for (const r of pizza.insumos) {
      if (r.stock < r.cantidad * item.cantidad) {
        if (/hawaiana/i.test(item.nombrePizza) && /queso/i.test(r.insumoNombre))
          return 'Sin queso no hay Hawaiana';
        return `Sin stock suficiente de ${r.insumoNombre} para ${item.nombrePizza}`;
      }
    }
  }
  return null;
}

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /pedidos (sin token). Todo o nada: pedido + detalle + stock. */
  async crear(dto: CreatePedidoDto) {
    const tipoEntrega = dto.tipoEntrega ?? 'Delivery';
    // Dirección obligatoria solo en Delivery; Recojo/Mesa usan valor por defecto.
    let direccion = dto.direccion?.trim() || '';
    if (tipoEntrega === 'Delivery' && direccion.length < 5)
      throw new BadRequestException(
        'La dirección es obligatoria para delivery',
      );
    if (!direccion)
      direccion =
        tipoEntrega === 'Mesa' && dto.mesa
          ? `Mesa ${dto.mesa}`
          : 'Recojo en tienda';

    // Se consultan ids únicos: un mismo pedido puede repetir la pizza en distintos tamaños.
    const idsUnicos = [...new Set(dto.items.map((i) => i.pizzaId))];
    const pizzas = await this.prisma.pizza.findMany({
      where: { id: { in: idsUnicos } },
      include: { insumos: { include: { insumo: true } } },
    });
    if (pizzas.length !== idsUnicos.length)
      throw new BadRequestException('Alguna pizza no existe');

    for (const item of dto.items) {
      const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
      if (!pizza.disponible)
        throw new BadRequestException(`${pizza.nombre} está agotada`);
    }

    // Sin stock no hay venta (todas las pizzas, presentes y futuras).
    const errorStock = faltaStock(
      pizzas.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        insumos: p.insumos.map((pi) => ({
          insumoId: pi.insumoId,
          insumoNombre: pi.insumo.nombre,
          stock: pi.insumo.stock,
          cantidad: pi.cantidad,
        })),
      })),
      dto.items.map((item) => ({
        pizzaId: item.pizzaId,
        nombrePizza: pizzas.find((p) => p.id === item.pizzaId)!.nombre,
        cantidad: item.cantidad,
      })),
    );
    if (errorStock) throw new BadRequestException(errorStock);

    // El total lo calcula el servidor: líneas + fee delivery si aplica.
    const subtotal = dto.items.reduce((acc, item) => {
      const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
      const unit = precioLinea(
        pizza,
        item.tamano as Tamano,
        item.extraQueso === true,
      );
      return acc + unit * item.cantidad;
    }, 0);
    const total =
      subtotal +
      (tipoEntrega === 'Delivery' && subtotal > 0 ? COSTO_DELIVERY : 0);

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
          direccion,
          referencia: dto.referencia?.trim() || null,
          tipoEntrega,
          metodoPago: dto.metodoPago ?? 'Efectivo',
          mesa: dto.mesa ?? null,
          total,
        },
      });
      for (const item of dto.items) {
        const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
        const unit = precioLinea(
          pizza,
          item.tamano as Tamano,
          item.extraQueso === true,
        );
        await tx.detallePedido.create({
          data: {
            pedidoId: pedido.id,
            pizzaId: pizza.id,
            cantidad: item.cantidad,
            tamano: item.tamano,
            nota: item.nota?.trim() || null,
            extraQueso: item.extraQueso === true,
            precioUnit: unit,
          },
        });
        for (const pi of pizza.insumos) {
          await tx.insumo.update({
            where: { id: pi.insumoId },
            data: { stock: { decrement: pi.cantidad * item.cantidad } },
          });
        }
      }
      const creado = await tx.pedido.findUniqueOrThrow({
        where: { id: pedido.id },
        include: { detalles: { include: { pizza: true } } },
      });
      return serializarPedido(creado);
    });
  }

  /** Tracking invitado por código + celular (con repartidor si fue asignado). */
  async tracking(codigo: string, celular: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { codigo },
      include: { detalles: { include: { pizza: true } } },
    });
    if (!pedido || pedido.celular !== celular)
      throw new NotFoundException('Pedido no encontrado');
    const base = serializarPedido(pedido);
    if (!pedido.repartidorId) return { ...base, repartidor: null };
    const rep = await this.prisma.trabajador.findUnique({
      where: { id: pedido.repartidorId },
      select: { nombre: true, usuario: true },
    });
    return { ...base, repartidor: rep };
  }

  /** Avance de estado con máquina estricta (JWT rol). */
  async cambiarEstado(id: number, estado: EstadoPedido) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (SIGUIENTE_ESTADO[pedido.estado] !== estado)
      throw new BadRequestException(
        `Transición inválida: ${pedido.estado} → ${estado}`,
      );
    const actualizado = await this.prisma.pedido.update({
      where: { id },
      data: { estado },
    });
    return serializarPedido(actualizado);
  }

  /** Cocina asigna repartidor (solo delivery activos). */
  async asignarRepartidor(id: number, repartidorId: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    const rep = await this.prisma.trabajador.findUnique({
      where: { id: repartidorId },
    });
    if (!rep || !rep.activo || rep.rol !== 'Repartidor')
      throw new BadRequestException('Repartidor inválido o inactivo');
    const asignado = await this.prisma.pedido.update({
      where: { id },
      data: { repartidorId },
    });
    return serializarPedido(asignado);
  }

  /** Mis entregas: solo las asignadas a mí y no entregadas. */
  async misEntregas(trabajadorId: number) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { repartidorId: trabajadorId, estado: { not: 'Entregado' } },
      orderBy: { creadoEn: 'asc' },
      include: { detalles: { include: { pizza: true } } },
    });
    return pedidos.map(serializarPedido);
  }

  /** Cajero/Admin valida el comprobante Yape. */
  async verificarPago(id: number, estadoPago: EstadoPago) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.metodoPago !== 'Yape')
      throw new BadRequestException('Solo pedidos Yape requieren verificación');
    const verificado = await this.prisma.pedido.update({
      where: { id },
      data: { estadoPago },
    });
    return serializarPedido(verificado);
  }

  /** Cliente sube comprobante Yape (imagen JPG/PNG/WebP ≤3MB). */
  async subirComprobante(id: number, filename: string) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.metodoPago !== 'Yape' || pedido.estado !== 'Recibido')
      throw new BadRequestException('Este pedido no admite comprobante');
    const conComprobante = await this.prisma.pedido.update({
      where: { id },
      data: { comprobanteUrl: `/uploads/comprobantes/${filename}` },
    });
    return serializarPedido(conComprobante);
  }

  async findAll() {
    const pedidos = await this.prisma.pedido.findMany({
      orderBy: { creadoEn: 'desc' },
      include: { detalles: { include: { pizza: true } } },
    });
    return pedidos.map(serializarPedido);
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type EstadoPago, type EstadoPedido } from '@prisma/client';
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../../middlewares/jwt-auth.guard';
import { precioPorTamano, EXTRA_QUESO_PRECIO } from '../../../utils/precios';
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
  return `CP360-${randomBytes(6).toString('hex').toUpperCase()}`;
}

function tipoImagen(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
    return 'image/jpeg';
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
  throw new BadRequestException('Solo imágenes JPG/PNG/WebP');
}

const privados = () => join(process.cwd(), 'uploads-private', 'comprobantes');

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
  const consumos = new Map<number, Prisma.Decimal>();
  for (const item of items) {
    const pizza = pizzas.find((p) => p.id === item.pizzaId);
    if (!pizza) continue;
    for (const r of pizza.insumos) {
      const acumulado = (
        consumos.get(r.insumoId) ?? new Prisma.Decimal(0)
      ).plus(new Prisma.Decimal(r.cantidad).times(item.cantidad));
      consumos.set(r.insumoId, acumulado);
      if (acumulado.gt(r.stock)) {
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private tokenComprobante(id: number, codigo: string, celular: string) {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_SECRET'))
      .update(`comprobante:${id}:${codigo}:${celular}`)
      .digest('hex');
  }

  /** POST /pedidos (sin token). Todo o nada: pedido + detalle + stock. */
  async crear(dto: CreatePedidoDto, actor?: JwtPayload) {
    const tipoEntrega = dto.tipoEntrega ?? 'Delivery';
    if (
      tipoEntrega === 'Mesa' &&
      (!actor || !['Admin', 'Cajero'].includes(actor.rol))
    )
      throw new ForbiddenException(
        'Solo caja o administración pueden registrar comandas',
      );
    if (tipoEntrega === 'Mesa' && (!dto.mesa || dto.mesa < 1 || dto.mesa > 12))
      throw new BadRequestException('Indica una mesa del 1 al 12');
    const { claveSolicitud, totalEsperado, ...contenido } = dto;
    const huella = createHash('sha256')
      .update(
        JSON.stringify({
          ...contenido,
          actor: actor?.sub ?? null,
        }),
      )
      .digest('hex');
    const recuperar = async () => {
      if (!claveSolicitud) return null;
      const anterior = await this.prisma.pedido.findUnique({
        where: { claveSolicitud },
        include: { detalles: { include: { pizza: true } } },
      });
      if (!anterior) return null;
      if (anterior.huellaSolicitud !== huella)
        throw new ConflictException('La clave ya se usó para otro pedido');
      return serializarPedido(anterior);
    };
    const anterior = await recuperar();
    if (anterior) return anterior;
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
    if (errorStock) {
      const repetido = await recuperar();
      if (repetido) return repetido;
      throw new BadRequestException(errorStock);
    }
    const consumos = new Map<number, Prisma.Decimal>();
    for (const item of dto.items) {
      for (const insumo of pizzas.find((p) => p.id === item.pizzaId)!.insumos) {
        const anterior = consumos.get(insumo.insumoId) ?? new Prisma.Decimal(0);
        consumos.set(
          insumo.insumoId,
          anterior.plus(
            new Prisma.Decimal(insumo.cantidad).times(item.cantidad),
          ),
        );
      }
    }

    // El total lo calcula el servidor: líneas + fee delivery si aplica.
    let codigo = codigoPedido();
    for (let i = 0; i < 5; i++) {
      const existe = await this.prisma.pedido.findUnique({ where: { codigo } });
      if (!existe) break;
      codigo = codigoPedido();
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const ahora = new Date();
        const ofertas = tipoEntrega === 'Mesa' ? [] : await tx.promocion.findMany({
          where: {
            pizzaId: { in: idsUnicos }, activa: true, inicio: { lte: ahora },
            OR: [{ fin: null }, { fin: { gt: ahora } }],
          },
        });
        const lineas = dto.items.map((item) => {
          const pizza = pizzas.find((p) => p.id === item.pizzaId)!;
          const base = ofertas.reduce((precio, oferta) =>
            oferta.pizzaId === item.pizzaId && oferta.tamano === item.tamano
              ? Math.min(precio, Number(oferta.precioPromo)) : precio,
          precioPorTamano(pizza, item.tamano));
          const precioUnit = Math.round(base * 100) + (item.extraQueso ? EXTRA_QUESO_PRECIO * 100 : 0);
          return { item, precioUnit };
        });
        const subtotal = lineas.reduce((acc, { item, precioUnit }) => acc + precioUnit * item.cantidad, 0);
        const total = (subtotal + (tipoEntrega === 'Delivery' && subtotal > 0 ? COSTO_DELIVERY * 100 : 0)) / 100;
        if (totalEsperado != null && Math.round(totalEsperado * 100) !== Math.round(total * 100))
          throw new ConflictException('El precio cambió. Revisa el total actualizado y vuelve a confirmar.');
        const pedido = await tx.pedido.create({
          data: {
            codigo,
            claveSolicitud,
            huellaSolicitud: claveSolicitud ? huella : undefined,
            nombres: dto.nombres.trim(),
            apellidos: dto.apellidos.trim(),
            celular: dto.celular,
            direccion,
            referencia: dto.referencia?.trim() || null,
            tipoEntrega,
            metodoPago: dto.metodoPago ?? 'Efectivo',
            mesa: tipoEntrega === 'Mesa' ? dto.mesa : null,
            total,
          },
        });
        for (const [id, consumo] of [...consumos].sort(([a], [b]) => a - b)) {
          const cantidad = consumo.toNumber();
          const { count } = await tx.insumo.updateMany({
            where: { id, stock: { gte: cantidad } },
            data: { stock: { decrement: cantidad } },
          });
          if (!count)
            throw new BadRequestException(
              'Sin stock suficiente para completar el pedido',
            );
        }
        for (const { item, precioUnit } of lineas) {
          await tx.detallePedido.create({
            data: {
              pedidoId: pedido.id,
              pizzaId: item.pizzaId,
              cantidad: item.cantidad,
              tamano: item.tamano,
              nota: item.nota?.trim() || null,
              extraQueso: item.extraQueso === true,
              precioUnit: precioUnit / 100,
            },
          });
        }
        const creado = await tx.pedido.findUniqueOrThrow({
          where: { id: pedido.id },
          include: { detalles: { include: { pizza: true } } },
        });
        return serializarPedido(creado);
      });
    } catch (error) {
      if (
        claveSolicitud &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const repetido = await recuperar();
        if (repetido) return repetido;
      }
      throw error;
    }
  }

  /** Tracking invitado por código + celular (con repartidor si fue asignado). */
  async tracking(codigo: string, celular: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { codigo },
      include: { detalles: { include: { pizza: true } } },
    });
    if (!pedido || pedido.celular !== celular)
      throw new NotFoundException('Pedido no encontrado');
    const base = {
      ...serializarPedido(pedido),
      ...(pedido.metodoPago === 'Yape' &&
      pedido.tipoEntrega !== 'Mesa' &&
      pedido.estado === 'Recibido' &&
      (pedido.estadoPago === 'Rechazado' ||
        (pedido.estadoPago === 'Pendiente' && !pedido.comprobanteUrl))
        ? {
            comprobanteToken: this.tokenComprobante(
              pedido.id,
              pedido.codigo,
              pedido.celular,
            ),
          }
        : {}),
    };
    if (pedido.tipoEntrega !== 'Delivery' || !pedido.repartidorId)
      return { ...base, repartidor: null };
    const rep = await this.prisma.trabajador.findUnique({
      where: { id: pedido.repartidorId },
      select: { nombre: true, usuario: true },
    });
    return { ...base, repartidor: rep };
  }

  /** Avance de estado con máquina estricta (JWT rol). */
  async cambiarEstado(id: number, estado: EstadoPedido, actor: JwtPayload) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    const delivery = pedido.tipoEntrega === 'Delivery';
    const entrega = estado === 'EnCamino' || estado === 'Entregado';
    if (
      actor.rol === 'Repartidor' &&
      (!delivery || pedido.repartidorId !== actor.sub || !entrega)
    )
      throw new ForbiddenException(
        'Solo puedes avanzar tus entregas asignadas',
      );
    if (delivery && entrega && !pedido.repartidorId)
      throw new BadRequestException('Asigna un repartidor primero');
    if (
      estado === 'Preparacion' &&
      pedido.tipoEntrega !== 'Mesa' &&
      pedido.metodoPago === 'Yape' &&
      pedido.estadoPago !== 'Verificado'
    )
      throw new BadRequestException('Caja debe aprobar el pago Yape primero');
    const siguiente =
      !delivery && pedido.estado === 'Listo'
        ? 'Entregado'
        : SIGUIENTE_ESTADO[pedido.estado];
    if (siguiente !== estado)
      throw new BadRequestException(
        `Transición inválida: ${pedido.estado} → ${estado}`,
      );
    const actualizado = await this.prisma.pedido.update({
      where: {
        id,
        estado: pedido.estado,
        repartidorId: pedido.repartidorId,
        estadoPago: pedido.estadoPago,
      },
      data: {
        estado,
        ...(estado === 'Entregado' &&
        (pedido.metodoPago === 'Efectivo' || pedido.tipoEntrega === 'Mesa')
          ? { estadoPago: 'Verificado' }
          : {}),
      },
    });
    return serializarPedido(actualizado);
  }

  /** Cocina asigna repartidor (solo delivery activos). */
  async asignarRepartidor(id: number, repartidorId: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (
      pedido.tipoEntrega !== 'Delivery' ||
      ['EnCamino', 'Entregado'].includes(pedido.estado)
    )
      throw new BadRequestException(
        'Este pedido no admite asignación de reparto',
      );
    const rep = await this.prisma.trabajador.findUnique({
      where: { id: repartidorId },
    });
    if (!rep || !rep.activo || rep.rol !== 'Repartidor')
      throw new BadRequestException('Repartidor inválido o inactivo');
    const asignado = await this.prisma.pedido.update({
      where: { id, estado: pedido.estado },
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
    if (
      pedido.metodoPago !== 'Yape' ||
      pedido.estado !== 'Recibido' ||
      !pedido.comprobanteUrl ||
      pedido.estadoPago !== 'Pendiente'
    )
      throw new BadRequestException('Solo pedidos Yape requieren verificación');
    const verificado = await this.prisma.pedido.update({
      where: {
        id,
        estado: 'Recibido',
        comprobanteUrl: pedido.comprobanteUrl,
        estadoPago: 'Pendiente',
      },
      data: { estadoPago },
    });
    return serializarPedido(verificado);
  }

  /** Cliente sube comprobante Yape (imagen JPG/PNG/WebP ≤3MB). */
  async subirComprobante(id: number, token: string | undefined, bytes: Buffer) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (
      !pedido ||
      !token ||
      !/^[0-9a-f]{64}$/.test(token) ||
      !timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(
          this.tokenComprobante(id, pedido.codigo, pedido.celular),
          'hex',
        ),
      )
    )
      throw new ForbiddenException(
        'No tienes permiso para adjuntar el comprobante',
      );
    if (
      pedido.metodoPago !== 'Yape' ||
      pedido.estado !== 'Recibido' ||
      pedido.tipoEntrega === 'Mesa' ||
      pedido.estadoPago === 'Verificado' ||
      (pedido.estadoPago === 'Pendiente' && pedido.comprobanteUrl)
    )
      throw new BadRequestException('Este pedido no admite comprobante');
    tipoImagen(bytes);
    const filename = randomUUID();
    await mkdir(privados(), { recursive: true });
    const path = join(privados(), filename);
    let conComprobante;
    try {
      await writeFile(path, bytes, { flag: 'wx' });
      conComprobante = await this.prisma.pedido.update({
        where: {
          id,
          estado: 'Recibido',
          estadoPago: pedido.estadoPago,
          comprobanteUrl: pedido.comprobanteUrl,
        },
        data: { comprobanteUrl: filename, estadoPago: 'Pendiente' },
      });
    } catch (error) {
      await unlink(path).catch(() => undefined);
      throw error;
    }
    if (pedido.comprobanteUrl)
      await unlink(this.rutaComprobante(pedido.comprobanteUrl)).catch(
        () => undefined,
      );
    return serializarPedido(conComprobante);
  }

  private rutaComprobante(referencia: string) {
    return join(
      referencia.startsWith('/uploads/comprobantes/')
        ? join(process.cwd(), 'uploads', 'comprobantes')
        : privados(),
      basename(referencia),
    );
  }

  async leerComprobante(id: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido?.comprobanteUrl)
      throw new NotFoundException('Comprobante no encontrado');
    const bytes = await readFile(
      this.rutaComprobante(pedido.comprobanteUrl),
    ).catch(() => {
      throw new NotFoundException('Comprobante no encontrado');
    });
    return { bytes, tipo: tipoImagen(bytes) };
  }

  async findAll() {
    const pedidos = await this.prisma.pedido.findMany({
      orderBy: { creadoEn: 'desc' },
      include: { detalles: { include: { pizza: true } } },
    });
    return pedidos.map(serializarPedido);
  }
}

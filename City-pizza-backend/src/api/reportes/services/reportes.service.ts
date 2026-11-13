import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../config/prisma/prisma.service';
import type {
  RangoFechasDto,
  TopProductosQueryDto,
} from '../dto/reportes-query.dto';
import {
  claveDiaLima,
  diasEntre,
  fechaISOValida,
  finDiaLimaExclusivo,
  inicioDiaLima,
  sumarDiasISO,
} from '../utils/fechas-lima';

const MAX_DIAS_RANGO = 90;

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dashboard básico: pedidos hoy, en curso, ventas, alertas stock. */
  async resumen() {
    const hoy = claveDiaLima(new Date());
    const [pedidosHoy, enCurso, insumos] = await Promise.all([
      this.prisma.pedido.findMany({
        where: {
          creadoEn: {
            gte: inicioDiaLima(hoy),
            lt: finDiaLimaExclusivo(hoy),
          },
        },
        select: { total: true },
      }),
      this.prisma.pedido.count({ where: { estado: { not: 'Entregado' } } }),
      this.prisma.insumo.findMany(),
    ]);
    return {
      pedidosHoy: pedidosHoy.length,
      enCurso,
      ventasHoy: pedidosHoy.reduce((acc, p) => acc + Number(p.total), 0),
      alertasStock: insumos.filter((i) => i.stock <= i.stockMinimo).length,
    };
  }

  /** Ventas por día local. Por defecto: últimos 7 días (incluye hoy). */
  async ventasPorDia(dto: RangoFechasDto = {}) {
    const rango = this.resolverRango(dto.desde, dto.hasta);
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        creadoEn: {
          gte: inicioDiaLima(rango.desde),
          lt: finDiaLimaExclusivo(rango.hasta),
        },
      },
      select: { creadoEn: true, total: true },
      orderBy: { creadoEn: 'asc' },
    });

    const dias = new Map<string, { pedidos: number; ventas: number }>();
    for (
      let fecha = rango.desde;
      fecha <= rango.hasta;
      fecha = sumarDiasISO(fecha, 1)
    ) {
      dias.set(fecha, { pedidos: 0, ventas: 0 });
    }

    for (const pedido of pedidos) {
      const key = claveDiaLima(pedido.creadoEn);
      const dia = dias.get(key);
      if (dia) {
        dia.pedidos += 1;
        dia.ventas += Number(pedido.total);
      }
    }

    return Array.from(dias, ([fecha, valores]) => ({
      fecha,
      ...valores,
    }));
  }

  /** Top productos por cantidad. Sin rango: histórico completo. */
  async topProductos(dto: TopProductosQueryDto = {}) {
    const where = this.filtroPorRango(dto);
    const grupos = await this.prisma.detallePedido.groupBy({
      by: ['pizzaId'],
      where,
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: dto.limit ?? 5,
    });
    const pizzas = await this.prisma.pizza.findMany({
      where: { id: { in: grupos.map((g) => g.pizzaId) } },
    });
    return grupos.map((g) => ({
      pizzaId: g.pizzaId,
      nombre: pizzas.find((p) => p.id === g.pizzaId)?.nombre ?? `#${g.pizzaId}`,
      cantidad: g._sum.cantidad ?? 0,
    }));
  }

  private filtroPorRango(
    dto: RangoFechasDto,
  ): Prisma.DetallePedidoWhereInput | undefined {
    if (!dto.desde && !dto.hasta) return undefined;
    const rango = this.resolverRango(dto.desde, dto.hasta);
    return {
      pedido: {
        creadoEn: {
          gte: inicioDiaLima(rango.desde),
          lt: finDiaLimaExclusivo(rango.hasta),
        },
      },
    };
  }

  private resolverRango(desde?: string, hasta?: string) {
    const hastaFinal = hasta ?? claveDiaLima(new Date());
    const desdeFinal = desde ?? sumarDiasISO(hastaFinal, -6);

    if (!fechaISOValida(desdeFinal) || !fechaISOValida(hastaFinal)) {
      throw new BadRequestException(
        'El rango de fechas no es válido (formato YYYY-MM-DD).',
      );
    }

    const dias = diasEntre(desdeFinal, hastaFinal);
    if (dias < 0) {
      throw new BadRequestException('"desde" no puede ser mayor que "hasta".');
    }
    if (dias + 1 > MAX_DIAS_RANGO) {
      throw new BadRequestException(
        `El rango máximo es de ${MAX_DIAS_RANGO} días.`,
      );
    }

    return { desde: desdeFinal, hasta: hastaFinal };
  }
}

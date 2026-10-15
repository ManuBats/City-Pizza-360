import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dashboard básico: pedidos hoy, en curso, ventas, alertas stock. */
  async resumen() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [pedidosHoy, enCurso, insumos] = await Promise.all([
      this.prisma.pedido.findMany({ where: { creadoEn: { gte: hoy } } }),
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

  /** Ventas de los últimos 7 días + top 5 productos por cantidad. */
  async ventasPorDia() {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - 6);
    const pedidos = await this.prisma.pedido.findMany({
      where: { creadoEn: { gte: desde } },
    });
    const dias: Record<string, { pedidos: number; ventas: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dias[d.toISOString().slice(0, 10)] = { pedidos: 0, ventas: 0 };
    }
    for (const p of pedidos) {
      const key = p.creadoEn.toISOString().slice(0, 10);
      if (dias[key]) {
        dias[key].pedidos += 1;
        dias[key].ventas += Number(p.total);
      }
    }
    return Object.entries(dias).map(([fecha, v]) => ({ fecha, ...v }));
  }

  async topProductos() {
    const grupos = await this.prisma.detallePedido.groupBy({
      by: ['pizzaId'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5,
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
}

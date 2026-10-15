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
}

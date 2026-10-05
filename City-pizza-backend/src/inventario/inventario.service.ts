import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.insumo.findMany({ orderBy: { nombre: 'asc' } });
  }

  /** Alerta: insumos con stock <= stockMinimo. */
  async alertas() {
    const insumos = await this.prisma.insumo.findMany();
    return insumos.filter((i) => i.stock <= i.stockMinimo);
  }

  ajustar(id: number, delta: number) {
    return this.prisma.insumo.update({
      where: { id },
      data: { stock: { increment: delta } },
    });
  }
}

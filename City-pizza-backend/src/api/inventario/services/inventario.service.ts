import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreateInsumoDto } from '../dto/insumo.dto';

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

  /** Admin crea insumo desde cero. */
  async crear(dto: CreateInsumoDto) {
    const nombre = dto.nombre.trim();
    const existe = await this.prisma.insumo.findUnique({ where: { nombre } });
    if (existe) throw new BadRequestException('Ese insumo ya existe');
    return this.prisma.insumo.create({
      data: {
        nombre,
        stock: dto.stock ?? 0,
        stockMinimo: dto.stockMinimo ?? 0,
        unidad: dto.unidad?.trim() || 'u',
      },
    });
  }

  /** Admin elimina insumo solo si ninguna pizza lo usa. */
  async eliminar(id: number) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id },
      include: { _count: { select: { pizzas: true } } },
    });
    if (!insumo) throw new NotFoundException('Insumo no encontrado');
    if (insumo._count.pizzas > 0)
      throw new ConflictException('No se puede borrar: lo usan recetas del catálogo');
    await this.prisma.insumo.delete({ where: { id } });
    return { ok: true };
  }
}

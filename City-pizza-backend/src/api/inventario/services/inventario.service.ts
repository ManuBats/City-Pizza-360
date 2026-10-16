import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { a2Decimales, serializarInsumo } from '../../../utils/serializar';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreateInsumoDto } from '../dto/insumo.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const insumos = await this.prisma.insumo.findMany({ orderBy: { nombre: 'asc' } });
    return insumos.map(serializarInsumo);
  }

  /** Alerta: insumos con stock <= stockMinimo. */
  async alertas() {
    const insumos = await this.prisma.insumo.findMany();
    return insumos
      .filter((i) => i.stock <= i.stockMinimo)
      .map(serializarInsumo);
  }

  async ajustar(id: number, delta: number) {
    const insumo = await this.prisma.insumo.update({
      where: { id },
      data: { stock: { increment: delta } },
    });
    return serializarInsumo(insumo);
  }

  /** Admin crea insumo desde cero (cantidades a 2 decimales). */
  async crear(dto: CreateInsumoDto) {
    const nombre = dto.nombre.trim();
    const existe = await this.prisma.insumo.findUnique({ where: { nombre } });
    if (existe) throw new BadRequestException('Ese insumo ya existe');
    const insumo = await this.prisma.insumo.create({
      data: {
        nombre,
        stock: a2Decimales(dto.stock ?? 0),
        stockMinimo: a2Decimales(dto.stockMinimo ?? 0),
        unidad: dto.unidad?.trim() || 'u',
      },
    });
    return serializarInsumo(insumo);
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

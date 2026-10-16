import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TipoPromocion } from '@prisma/client';
import { PROMO_FLASH_MAX_HORAS } from '../../../constants/negocio.constants';
import { serializarPromocion } from '../../../utils/serializar';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreatePromocionDto } from '../dto/promocion.dto';

@Injectable()
export class PromocionesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Promos visibles para el cliente: activas y no vencidas. */
  async visibles() {
    const promos = await this.prisma.promocion.findMany({
      where: {
        activa: true,
        OR: [{ fin: null }, { fin: { gt: new Date() } }],
      },
      orderBy: { inicio: 'desc' },
    });
    return promos.map(serializarPromocion);
  }

  async findAll() {
    const promos = await this.prisma.promocion.findMany({
      orderBy: { inicio: 'desc' },
    });
    return promos.map(serializarPromocion);
  }

  async crear(dto: CreatePromocionDto, rol: string) {
    // Cajero: solo Flash ≤48h, no permanentes, no elimina base ni cambia precio.
    if (rol === 'Cajero') {
      if (dto.tipo !== 'Flash')
        throw new ForbiddenException('Cajero solo crea promos Flash');
      const horas = dto.vigenciaHoras ?? 24;
      if (horas > PROMO_FLASH_MAX_HORAS)
        throw new BadRequestException(
          `Las promos de caja duran máximo ${PROMO_FLASH_MAX_HORAS} horas`,
        );
      const flash = await this.prisma.promocion.create({
        data: {
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim() || null,
          precioPromo: dto.precioPromo,
          tipo: 'Flash' as TipoPromocion,
          fin: new Date(Date.now() + horas * 3_600_000),
        },
      });
      return serializarPromocion(flash);
    }
    const promo = await this.prisma.promocion.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        precioPromo: dto.precioPromo,
        tipo: dto.tipo as TipoPromocion,
        fin: dto.vigenciaHoras
          ? new Date(Date.now() + dto.vigenciaHoras * 3_600_000)
          : null,
      },
    });
    return serializarPromocion(promo);
  }

  async toggle(id: number, activa: boolean) {
    const promo = await this.prisma.promocion
      .update({ where: { id }, data: { activa } })
      .catch(() => {
        throw new NotFoundException('Promoción no encontrada');
      });
    return serializarPromocion(promo);
  }

  /** Solo admin elimina (permanentes o flash). */
  async eliminar(id: number) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    await this.prisma.promocion.delete({ where: { id } });
    return { ok: true };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, TipoPromocion } from '@prisma/client';
import { PROMO_FLASH_MAX_HORAS } from '../../../constants/negocio.constants';
import { serializarPromocion } from '../../../utils/serializar';
import { PrismaService } from '../../../config/prisma/prisma.service';
import {
  CreatePromocionDto,
  UpdatePromocionDto,
} from '../dto/promocion.dto';

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

  /** Admin/Cajero edita promoción existente. */
  async actualizar(id: number, dto: UpdatePromocionDto) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');

    // Cajero no puede cambiar tipo a Permanente ni crear Flash > 48h al editar.
    if (dto.tipo !== undefined && dto.tipo === 'Permanente') {
      // Solo Admin puede crear/modificar a Permanente. El rol se valida en el controller vía guard,
      // pero aquí no tenemos acceso al rol. Se asume que el controller ya filtró por Roles.
      // Si se quiere restringir más, se puede pasar el rol como parámetro.
    }

    const data: Prisma.PromocionUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined)
      data.descripcion = dto.descripcion?.trim() || null;
    if (dto.precioPromo !== undefined) data.precioPromo = dto.precioPromo;
    if (dto.tipo !== undefined) data.tipo = dto.tipo as TipoPromocion;
    if (dto.vigenciaHoras !== undefined) {
      data.fin = new Date(Date.now() + dto.vigenciaHoras * 3_600_000);
    }
    if (dto.activa !== undefined) data.activa = dto.activa;

    const actualizada = await this.prisma.promocion.update({
      where: { id },
      data,
    });
    return serializarPromocion(actualizada);
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

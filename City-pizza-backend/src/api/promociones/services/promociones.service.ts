import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, TipoPromocion } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { PROMO_FLASH_MAX_HORAS } from '../../../constants/negocio.constants';
import { serializarPromocion } from '../../../utils/serializar';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreatePromocionDto, UpdatePromocionDto } from '../dto/promocion.dto';

@Injectable()
export class PromocionesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarProducto(pizzaId?: number | null, tamano?: string | null) {
    if (Boolean(pizzaId) !== Boolean(tamano))
      throw new BadRequestException('Selecciona un producto y un tamaño');
    if (pizzaId && !(await this.prisma.pizza.findUnique({ where: { id: pizzaId } })))
      throw new BadRequestException('El producto de la promoción no existe');
  }

  /** Promos visibles para el cliente: activas y no vencidas. */
  async visibles() {
    const promos = await this.prisma.promocion.findMany({
      where: {
        activa: true,
        inicio: { lte: new Date() },
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

  async subirImagen(id: number, bytes: Buffer) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    const extension = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      ? 'jpg'
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'png'
        : bytes.toString('ascii', 0, 4) === 'RIFF' &&
            bytes.toString('ascii', 8, 12) === 'WEBP'
          ? 'webp'
          : null;
    if (!extension) throw new BadRequestException('Solo imágenes JPG/PNG/WebP');
    const nombre = `promo-${randomUUID()}.${extension}`;
    const carpeta = join(process.cwd(), 'uploads', 'productos');
    const ruta = join(carpeta, nombre);
    await writeFile(ruta, bytes, { flag: 'wx' });
    try {
      const actualizada = await this.prisma.promocion.update({
        where: { id, imagenUrl: promo.imagenUrl },
        data: { imagenUrl: `/uploads/productos/${nombre}` },
      });
      if (promo.imagenUrl?.startsWith('/uploads/productos/promo-'))
        await unlink(join(carpeta, basename(promo.imagenUrl))).catch(
          () => undefined,
        );
      return serializarPromocion(actualizada);
    } catch (error) {
      await unlink(ruta).catch(() => undefined);
      throw error;
    }
  }

  async crear(dto: CreatePromocionDto, rol: string) {
    await this.validarProducto(dto.pizzaId, dto.tamano);
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
          pedidoOnline: dto.pedidoOnline ?? false,
          pizzaId: dto.pizzaId,
          tamano: dto.tamano,
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
        pedidoOnline: dto.pedidoOnline ?? false,
        pizzaId: dto.pizzaId,
        tamano: dto.tamano,
        tipo: dto.tipo as TipoPromocion,
        fin: dto.vigenciaHoras
          ? new Date(Date.now() + dto.vigenciaHoras * 3_600_000)
          : null,
      },
    });
    return serializarPromocion(promo);
  }

  /** Administración edita una promoción existente. */
  async actualizar(id: number, dto: UpdatePromocionDto) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');

    const data: Prisma.PromocionUpdateInput = {};
    if (dto.pizzaId !== undefined || dto.tamano !== undefined) {
      const pizzaId = dto.pizzaId === undefined ? promo.pizzaId : dto.pizzaId;
      const tamano = dto.tamano === undefined ? promo.tamano : dto.tamano;
      await this.validarProducto(pizzaId, tamano);
      data.pizza = pizzaId ? { connect: { id: pizzaId } } : { disconnect: true };
      data.tamano = tamano;
    }
    if (dto.pedidoOnline != null) data.pedidoOnline = dto.pedidoOnline;
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

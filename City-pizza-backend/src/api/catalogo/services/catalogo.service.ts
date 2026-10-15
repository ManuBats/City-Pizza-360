import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { serializarPizza } from '../../../utils/serializar';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreateProductoDto, UpdateProductoDto } from '../dto/producto.dto';

@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const pizzas = await this.prisma.pizza.findMany({ orderBy: { nombre: 'asc' } });
    return pizzas.map(serializarPizza);
  }

  async setDisponibilidad(id: number, disponible: boolean) {
    const pizza = await this.prisma.pizza.update({ where: { id }, data: { disponible } });
    return serializarPizza(pizza);
  }

  /** Admin crea producto (la imagen se sube después por /:id/imagen). */
  async crear(dto: CreateProductoDto) {
    const existe = await this.prisma.pizza.findUnique({
      where: { nombre: dto.nombre.trim() },
    });
    if (existe) throw new BadRequestException('Ese producto ya existe');
    const creada = await this.prisma.pizza.create({
      data: {
        nombre: dto.nombre.trim(),
        tipo: dto.tipo?.trim() || 'Pizza',
        categoria: dto.categoria?.trim() || 'Clásicas',
        precio: dto.precioFamiliar,
        precioPersonal: dto.precioPersonal,
        precioMediana: dto.precioMediana,
        precioFamiliar: dto.precioFamiliar,
      },
    });
    return serializarPizza(creada);
  }

  async actualizar(id: number, dto: UpdateProductoDto) {
    const pizza = await this.prisma.pizza.findUnique({ where: { id } });
    if (!pizza) throw new NotFoundException('Producto no encontrado');
    const data: Prisma.PizzaUpdateInput = {};
    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.tipo) data.tipo = dto.tipo.trim();
    if (dto.categoria) data.categoria = dto.categoria.trim();
    if (dto.precioPersonal !== undefined) data.precioPersonal = dto.precioPersonal;
    if (dto.precioMediana !== undefined) data.precioMediana = dto.precioMediana;
    if (dto.precioFamiliar !== undefined) {
      data.precioFamiliar = dto.precioFamiliar;
      data.precio = dto.precioFamiliar;
    }
    if (dto.disponible !== undefined) data.disponible = dto.disponible;
    const actualizada = await this.prisma.pizza.update({ where: { id }, data });
    return serializarPizza(actualizada);
  }

  async subirImagen(id: number, filename: string) {
    const pizza = await this.prisma.pizza.findUnique({ where: { id } });
    if (!pizza) throw new NotFoundException('Producto no encontrado');
    const conImagen = await this.prisma.pizza.update({
      where: { id },
      data: { imagenUrl: `/uploads/productos/${filename}` },
    });
    return serializarPizza(conImagen);
  }

  /** Solo admin elimina; con historial de pedidos se bloquea (409). */
  async eliminar(id: number) {
    const pizza = await this.prisma.pizza.findUnique({
      where: { id },
      include: { _count: { select: { detalles: true } } },
    });
    if (!pizza) throw new NotFoundException('Producto no encontrado');
    if (pizza._count.detalles > 0)
      throw new ConflictException(
        'No se puede borrar: tiene pedidos asociados. Márcalo como Agotado.',
      );
    await this.prisma.pizza.delete({ where: { id } });
    return { ok: true };
  }
}

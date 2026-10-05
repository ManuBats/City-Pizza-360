import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.pizza.findMany({ orderBy: { nombre: 'asc' } });
  }

  setDisponibilidad(id: number, disponible: boolean) {
    return this.prisma.pizza.update({ where: { id }, data: { disponible } });
  }
}

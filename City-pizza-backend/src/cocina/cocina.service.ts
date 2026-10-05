import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CocinaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cola KDS: pedidos no entregados, más antiguos primero (polling 3s). */
  cola() {
    return this.prisma.pedido.findMany({
      where: { estado: { in: ['Recibido', 'Preparacion'] } },
      orderBy: { creadoEn: 'asc' },
      include: { detalles: { include: { pizza: true } } },
    });
  }
}

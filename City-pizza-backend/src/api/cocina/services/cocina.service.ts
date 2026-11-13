import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';

@Injectable()
export class CocinaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Comandas activas y deliveries listos que aún requieren asignación. */
  cola() {
    return this.prisma.pedido.findMany({
      where: {
        OR: [
          { estado: { in: ['Recibido', 'Preparacion'] } },
          { estado: 'Listo', tipoEntrega: 'Delivery', repartidorId: null },
        ],
      },
      orderBy: { creadoEn: 'asc' },
      include: { detalles: { include: { pizza: true } } },
    });
  }
}

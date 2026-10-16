import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreateTrabajadorDto } from '../dto/trabajador.dto';

/** El hash nunca sale del servidor: no se selecciona en las respuestas. */
const SIN_HASH = {
  id: true,
  usuario: true,
  nombre: true,
  rol: true,
  activo: true,
} as const;

@Injectable()
export class TrabajadoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Solo admin crea/baja trabajadores (RBAC en controller). */
  findAll() {
    return this.prisma.trabajador.findMany({
      orderBy: { nombre: 'asc' },
      select: SIN_HASH,
    });
  }

  /** Repartidores activos con sus entregas en curso (para asignar en cocina). */
  async repartidores() {
    const users = await this.prisma.trabajador.findMany({
      where: { rol: 'Repartidor', activo: true },
      orderBy: { nombre: 'asc' },
      select: SIN_HASH,
    });
    const conteo = await this.prisma.pedido.groupBy({
      by: ['repartidorId'],
      where: { repartidorId: { not: null }, estado: { not: 'Entregado' } },
      _count: { repartidorId: true },
    });
    return users.map((u) => ({
      ...u,
      activas:
        conteo.find((c) => c.repartidorId === u.id)?._count.repartidorId ?? 0,
    }));
  }

  async crear(dto: CreateTrabajadorDto) {
    const usuario = dto.usuario.toLowerCase().trim();
    const existe = await this.prisma.trabajador.findUnique({
      where: { usuario },
    });
    if (existe) throw new BadRequestException('Ese usuario ya existe');
    const passHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.trabajador.create({
      data: { usuario, nombre: dto.nombre.trim(), rol: dto.rol, passHash },
      select: SIN_HASH,
    });
  }

  async setActivo(usuario: string, activo: boolean) {
    const user = await this.prisma.trabajador.findUnique({
      where: { usuario },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.rol === 'Admin' && !activo)
      throw new BadRequestException('No puedes desactivar al admin');
    return this.prisma.trabajador.update({
      where: { usuario },
      data: { activo },
      select: SIN_HASH,
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { CreateTrabajadorDto } from '../dto/trabajador.dto';

@Injectable()
export class TrabajadoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Solo admin crea/baja trabajadores (RBAC en controller). */
  async findAll() {
    const users = await this.prisma.trabajador.findMany({ orderBy: { nombre: 'asc' } });
    return users.map(({ passHash: _h, ...u }) => u);
  }

  /** Repartidores activos con sus entregas en curso (para asignar en cocina). */
  async repartidores() {
    const users = await this.prisma.trabajador.findMany({
      where: { rol: 'Repartidor', activo: true },
      orderBy: { nombre: 'asc' },
    });
    const conteo = await this.prisma.pedido.groupBy({
      by: ['repartidorId'],
      where: { repartidorId: { not: null }, estado: { not: 'Entregado' } },
      _count: { repartidorId: true },
    });
    return users.map(({ passHash: _h, ...u }) => ({
      ...u,
      activas: conteo.find((c) => c.repartidorId === u.id)?._count.repartidorId ?? 0,
    }));
  }

  async crear(dto: CreateTrabajadorDto) {
    const usuario = dto.usuario.toLowerCase().trim();
    const existe = await this.prisma.trabajador.findUnique({ where: { usuario } });
    if (existe) throw new BadRequestException('Ese usuario ya existe');
    const passHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.trabajador.create({
      data: { usuario, nombre: dto.nombre.trim(), rol: dto.rol, passHash },
    });
    const { passHash: _h, ...safe } = user;
    return safe;
  }

  async setActivo(usuario: string, activo: boolean) {
    const user = await this.prisma.trabajador.findUnique({ where: { usuario } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.rol === 'Admin' && !activo)
      throw new BadRequestException('No puedes desactivar al admin');
    const updated = await this.prisma.trabajador.update({
      where: { usuario },
      data: { activo },
    });
    const { passHash: _h, ...safe } = updated;
    return safe;
  }
}

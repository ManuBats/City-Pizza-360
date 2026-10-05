import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrabajadorDto } from './trabajador.dto';

@Injectable()
export class TrabajadoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Solo admin crea/baja trabajadores (RBAC en controller). */
  async findAll() {
    const users = await this.prisma.trabajador.findMany({ orderBy: { nombre: 'asc' } });
    return users.map(({ passHash: _h, ...u }) => u);
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

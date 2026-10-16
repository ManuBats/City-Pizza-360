import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { JWT_EXPIRES_IN } from '../../../constants/auth.constants';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.trabajador.findUnique({
      where: { usuario: dto.usuario.toLowerCase().trim() },
    });
    if (!user || !user.activo)
      throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    const token = await this.jwt.signAsync(
      {
        sub: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: JWT_EXPIRES_IN,
      },
    );
    return { token, usuario: user.usuario, nombre: user.nombre, rol: user.rol };
  }

  async session(userId: number) {
    const user = await this.prisma.trabajador.findUnique({
      where: { id: userId },
    });
    if (!user || !user.activo)
      throw new UnauthorizedException('Sesión inválida');
    return { usuario: user.usuario, nombre: user.nombre, rol: user.rol };
  }
}

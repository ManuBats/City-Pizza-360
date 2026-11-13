import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../config/prisma/prisma.service';

export type JwtPayload = {
  sub: number;
  usuario: string;
  nombre: string;
  rol: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    const token = header?.startsWith('Bearer ')
      ? header.slice(7).trim()
      : undefined;
    if (!token) throw new UnauthorizedException('Falta token');
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    if (
      !Number.isInteger(payload?.sub) ||
      payload.sub < 1 ||
      payload.sub > 2_147_483_647
    )
      throw new UnauthorizedException('Identificador de sesión inválido');

    // Consultar en cada petición: un JWT anterior no conserva accesos revocados.
    // Los fallos de infraestructura se propagan; no son credenciales inválidas.
    const trabajador = await this.prisma.trabajador.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        usuario: true,
        nombre: true,
        rol: true,
        activo: true,
      },
    });
    if (!trabajador || !trabajador.activo)
      throw new UnauthorizedException('Sesión inválida');

    req.user = {
      sub: trabajador.id,
      usuario: trabajador.usuario,
      nombre: trabajador.nombre,
      rol: trabajador.rol,
    } satisfies JwtPayload;
    return true;
  }
}

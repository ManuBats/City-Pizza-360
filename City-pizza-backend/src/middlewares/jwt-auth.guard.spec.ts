import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../config/prisma/prisma.service';
import { JwtAuthGuard, JwtPayload } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

describe('JwtAuthGuard sin conexión a PostgreSQL', () => {
  // Clave exclusiva de estas pruebas; no se carga configuración del entorno.
  const secret = 'clave-exclusiva-de-pruebas-unitarias';
  const jwt = new JwtService();
  const trabajador = {
    id: 7,
    usuario: 'trabajador.test',
    nombre: 'Prueba',
    rol: 'Cajero',
    activo: true,
  };
  let findUnique: jest.Mock;
  let guard: JwtAuthGuard;
  let req: { headers: { authorization?: string }; user?: JwtPayload };
  let context: ExecutionContext;
  let handler: () => void;

  const token = (claims: object = { sub: 7, rol: 'Admin' }) =>
    jwt.sign(claims, { secret, expiresIn: '12h' });

  beforeEach(() => {
    findUnique = jest.fn().mockResolvedValue({ ...trabajador });
    guard = new JwtAuthGuard(
      jwt,
      {
        getOrThrow: jest.fn().mockReturnValue(secret),
      } as unknown as ConfigService,
      { trabajador: { findUnique } } as unknown as PrismaService,
    );
    req = { headers: { authorization: `Bearer ${token()}` } };
    handler = () => undefined;
    context = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
      getClass: () => class TestController {},
    } as unknown as ExecutionContext;
  });

  it.each([undefined, '', 'Basic prueba', 'Bearer '])(
    'rechaza token ausente o esquema incorrecto: %s',
    async (header) => {
      req.headers.authorization = header;
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(findUnique).not.toHaveBeenCalled();
    },
  );

  it.each([
    'malformado',
    jwt.sign({ sub: 7 }, { secret: 'otra-clave-de-prueba' }),
    jwt.sign({ sub: 7 }, { secret, expiresIn: -1 }),
  ])(
    'rechaza token inválido, firma incorrecta o vencimiento (%#)',
    async (value) => {
      req.headers.authorization = `Bearer ${value}`;
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(findUnique).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    },
  );

  it.each([undefined, null, '7', 0, -1, 1.5, 2_147_483_648, {}, []])(
    'rechaza sub inválido (%#)',
    async (sub) => {
      req.headers.authorization = `Bearer ${token({ sub })}`;
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(findUnique).not.toHaveBeenCalled();
    },
  );

  it.each([null, { ...trabajador, activo: false }])(
    'rechaza trabajador inexistente o desactivado (%#)',
    async (value) => {
      findUnique.mockResolvedValue(value);
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(req.user).toBeUndefined();
    },
  );

  it.each(['Admin', 'Cajero', 'Cocinero', 'Repartidor', 'Mesero'])(
    'conserva identidad y rol actuales: %s',
    async (rol) => {
      findUnique.mockResolvedValue({ ...trabajador, rol });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(req.user).toEqual({
        sub: 7,
        usuario: trabajador.usuario,
        nombre: trabajador.nombre,
        rol,
      });
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        select: {
          id: true,
          usuario: true,
          nombre: true,
          rol: true,
          activo: true,
        },
      });
    },
  );

  it('rechaza la siguiente petición tras desactivar al trabajador con el mismo token', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
    findUnique.mockResolvedValue({ ...trabajador, activo: false });
    delete req.user;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(req.user).toBeUndefined();
  });

  it('aplica el cambio de rol con el mismo JWT antes de comprobar permisos', async () => {
    const roles = new RolesGuard(new Reflector());
    Reflect.defineMetadata(ROLES_KEY, ['Admin'], handler);
    findUnique.mockResolvedValueOnce({ ...trabajador, rol: 'Admin' });
    await guard.canActivate(context);
    expect(roles.canActivate(context)).toBe(true);
    await guard.canActivate(context);
    expect(req.user.rol).toBe('Cajero');
    expect(() => roles.canActivate(context)).toThrow(ForbiddenException);
    Reflect.defineMetadata(ROLES_KEY, ['Cajero'], handler);
    expect(roles.canActivate(context)).toBe(true);
  });

  it('propaga el fallo de base de datos y no autoriza ni lo convierte en 401', async () => {
    const error = new Error('Fallo simulado de infraestructura');
    findUnique.mockRejectedValue(error);
    await expect(guard.canActivate(context)).rejects.toBe(error);
    expect(req.user).toBeUndefined();
  });
});

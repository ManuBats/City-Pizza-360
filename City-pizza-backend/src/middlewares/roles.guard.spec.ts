import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  const roles = ['Admin', 'Cajero', 'Cocinero', 'Repartidor', 'Mesero'];
  let guard: RolesGuard;
  let handler: () => void;
  let controller: object;
  let req: { user?: { rol: string } };
  let context: ExecutionContext;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
    handler = () => undefined;
    controller = class TestController {};
    req = {};
    context = {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  });

  it.each(roles)('permite al rol declarado: %s', (rol) => {
    Reflect.defineMetadata(ROLES_KEY, [rol], handler);
    req.user = { rol };
    expect(guard.canActivate(context)).toBe(true);
  });

  it.each(
    roles.flatMap((actual) =>
      roles
        .filter((allowed) => allowed !== actual)
        .map((allowed) => [actual, allowed]),
    ),
  )('rechaza %s cuando se exige %s', (actual, allowed) => {
    Reflect.defineMetadata(ROLES_KEY, [allowed], handler);
    req.user = { rol: actual };
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rechaza ausencia de usuario y rol desconocido cuando hay permisos requeridos', () => {
    Reflect.defineMetadata(ROLES_KEY, ['Admin'], handler);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    req.user = { rol: 'Desconocido' };
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('respeta permisos del controlador y prioridad del método', () => {
    Reflect.defineMetadata(ROLES_KEY, ['Admin'], controller);
    req.user = { rol: 'Cocinero' };
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    Reflect.defineMetadata(ROLES_KEY, ['Admin', 'Cocinero'], handler);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('conserva el comportamiento sin restricciones de rol', () => {
    expect(guard.canActivate(context)).toBe(true);
    Reflect.defineMetadata(ROLES_KEY, [], handler);
    expect(guard.canActivate(context)).toBe(true);
  });
});

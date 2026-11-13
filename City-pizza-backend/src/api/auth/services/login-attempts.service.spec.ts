import { HttpException, UnauthorizedException } from '@nestjs/common';
import { LoginAttemptsService } from './login-attempts.service';

describe('LoginAttemptsService (memoria aislada)', () => {
  let service: LoginAttemptsService;
  const fail = () =>
    Promise.reject(new UnauthorizedException('Credenciales inválidas'));
  const ok = () => Promise.resolve('ok');
  async function failures(user: string, ip: string, count: number) {
    for (let i = 0; i < count; i++)
      await expect(service.run(user, ip, fail)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
  }
  async function blocked(user: string, ip: string, seconds: number) {
    const authenticate = jest.fn(ok);
    await expect(service.run(user, ip, authenticate)).rejects.toMatchObject({
      status: 429,
      response: { retryAfterSeconds: seconds },
    });
    expect(authenticate).not.toHaveBeenCalled();
  }
  beforeEach(() => {
    jest.useFakeTimers();
    service = new LoginAttemptsService();
  });
  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('cinco fallos devuelven 401 y el siguiente intento 429', async () => {
    await failures('caja', '127.0.0.1', 5);
    await blocked('caja', '127.0.0.1', 60);
  });
  it('se recupera a los 60 segundos sin prolongar el bloqueo con reintentos', async () => {
    await failures('caja', '127.0.0.1', 5);
    jest.advanceTimersByTime(30_000);
    await blocked('caja', '127.0.0.1', 30);
    jest.advanceTimersByTime(30_000);
    await expect(service.run('caja', '127.0.0.1', ok)).resolves.toBe('ok');
  });
  it('no bloquea a otro trabajador de la misma IP tras cinco fallos', async () => {
    await failures('caja', '127.0.0.1', 5);
    await expect(service.run('cocina', '127.0.0.1', ok)).resolves.toBe('ok');
  });
  it('cambiar de usuario no elude los 30 fallos agregados por IP', async () => {
    for (let i = 0; i < 30; i++) await failures(`usuario${i}`, '127.0.0.1', 1);
    await blocked('nuevo', '127.0.0.1', 60);
    await expect(service.run('nuevo', '127.0.0.2', ok)).resolves.toBe('ok');
  });
  it('comparte el límite de 20 fallos por usuario entre diferentes IP', async () => {
    for (let i = 1; i <= 20; i++) await failures('caja', `10.0.0.${i}`, 1);
    await blocked('caja', '10.0.0.21', 60);
    await expect(service.run('otro', '10.0.0.21', ok)).resolves.toBe('ok');
  });
  it('normaliza usuario y direcciones IPv4 mapeadas en IPv6', async () => {
    await failures('  CaJa  ', '::ffff:127.0.0.1', 5);
    await blocked('caja', '127.0.0.1', 60);
  });
  it('agrupa direcciones IPv6 de la misma red /64', async () => {
    await failures('caja', '2001:db8:1:2::1', 5);
    await blocked('caja', '2001:0db8:0001:0002:0:0:0:9', 60);
  });
  it('un acceso correcto no elimina fallos propios ni compartidos', async () => {
    await failures('caja', '127.0.0.1', 4);
    await service.run('caja', '127.0.0.1', ok);
    await service.run('otro', '127.0.0.1', ok);
    await failures('caja', '127.0.0.1', 1);
    await blocked('caja', '127.0.0.1', 60);
    for (let i = 0; i < 25; i++) await failures(`usuario${i}`, '127.0.0.1', 1);
    await blocked('nuevo', '127.0.0.1', 60);
  });
  it('libera reservas tras errores de infraestructura sin contabilizarlos', async () => {
    const error = new Error('Fallo simulado de infraestructura');
    for (let i = 0; i < 10; i++)
      await expect(
        service.run('caja', '127.0.0.1', () => Promise.reject(error)),
      ).rejects.toBe(error);
    await failures('caja', '127.0.0.1', 5);
    await blocked('caja', '127.0.0.1', 60);
  });
  it('reserva cupos antes de autenticar solicitudes simultáneas', async () => {
    let release: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const authenticate = jest.fn(async () => {
      await gate;
      throw new UnauthorizedException();
    });
    const attempts = Array.from({ length: 12 }, () =>
      service.run('caja', '127.0.0.1', authenticate),
    );
    const completed = Promise.allSettled(attempts);
    for (let i = 0; i < 100; i++) await Promise.resolve();
    expect(authenticate).toHaveBeenCalledTimes(5);
    release();
    const results = await completed;
    expect(
      results.filter(
        (r) => r.status === 'rejected' && r.reason.getStatus() === 401,
      ),
    ).toHaveLength(5);
    expect(
      results.filter(
        (r) => r.status === 'rejected' && r.reason.getStatus() === 429,
      ),
    ).toHaveLength(7);
  });
  it('elimina fallos y claves al expirar la ventana', async () => {
    await failures('caja', '127.0.0.1', 4);
    jest.advanceTimersByTime(15 * 60_000);
    await failures('caja', '127.0.0.1', 5);
    await blocked('caja', '127.0.0.1', 60);
  });
  it('un reinicio crea un estado independiente', async () => {
    await failures('caja', '127.0.0.1', 5);
    const fresh = new LoginAttemptsService();
    try {
      await expect(fresh.run('caja', '127.0.0.1', ok)).resolves.toBe('ok');
    } finally {
      fresh.onModuleDestroy();
    }
  });
  it('acota las claves en memoria y recupera capacidad tras su expiración', async () => {
    for (let i = 0; i < 4999; i++)
      await service.run(`usuario${i}`, '127.0.0.1', ok);
    await blocked('usuario-nuevo', '127.0.0.1', 60);
    jest.advanceTimersByTime(15 * 60_000);
    await expect(service.run('usuario-nuevo', '127.0.0.1', ok)).resolves.toBe(
      'ok',
    );
  });
  it('limita la concurrencia global y libera los cupos de accesos correctos', async () => {
    let release: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const authenticate = jest.fn(async () => {
      await gate;
      return 'ok';
    });
    const attempts = Array.from({ length: 65 }, (_, i) =>
      service.run(`usuario${i}`, `10.0.0.${i + 1}`, authenticate),
    );
    const completed = Promise.allSettled(attempts);
    for (let i = 0; i < 1000; i++) await Promise.resolve();
    expect(authenticate).toHaveBeenCalledTimes(64);
    release();
    const results = await completed;
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(64);
    expect(
      results.filter(
        (r) => r.status === 'rejected' && r.reason.getStatus() === 429,
      ),
    ).toHaveLength(1);
    await expect(service.run('otro', '127.0.0.1', ok)).resolves.toBe('ok');
  });
  it('rechaza un origen inválido sin autenticar', async () => {
    const authenticate = jest.fn(ok);
    await expect(
      service.run('caja', 'no-es-ip', authenticate),
    ).rejects.toBeInstanceOf(HttpException);
    expect(authenticate).not.toHaveBeenCalled();
  });
});

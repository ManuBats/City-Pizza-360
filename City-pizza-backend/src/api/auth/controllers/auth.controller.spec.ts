import {
  Controller,
  Get,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { JwtAuthGuard } from '../../../middlewares/jwt-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginAttemptsService } from '../services/login-attempts.service';
import { CatalogoController } from '../../catalogo/controllers/catalogo.controller';
import { CatalogoService } from '../../catalogo/services/catalogo.service';
import { PromocionesController } from '../../promociones/controllers/promociones.controller';
import { PromocionesService } from '../../promociones/services/promociones.service';

jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

@Controller('public-probe')
class PublicProbe {
  @Get() get() {
    return { ok: true };
  }
}

describe('HTTP login (Prisma y JWT simulados)', () => {
  let app: INestApplication;
  const findUnique = jest.fn();
  const signAsync = jest.fn();
  const worker = {
    id: 7,
    usuario: 'caja',
    nombre: 'Prueba',
    rol: 'Cajero',
    activo: true,
    passHash: 'hash-simulado',
  };
  const credentials = {
    usuario: 'caja',
    password: 'valor-exclusivo-de-prueba',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue(worker);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    signAsync.mockResolvedValue('token-simulado');
    const module = await Test.createTestingModule({
      controllers: [
        AuthController,
        PublicProbe,
        CatalogoController,
        PromocionesController,
      ],
      providers: [
        AuthService,
        LoginAttemptsService,
        {
          provide: CatalogoService,
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: PromocionesService,
          useValue: { visibles: jest.fn().mockResolvedValue([]) },
        },
        { provide: PrismaService, useValue: { trabajador: { findUnique } } },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('configuracion-de-prueba'),
          },
        },
        { provide: JwtService, useValue: { signAsync } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = { sub: 7 };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    // Evitar que Nest registre los errores simulados de infraestructura.
    app.useLogger(false);
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  it('mantiene el login correcto y normaliza el usuario', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, usuario: '  CaJa  ' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.rol).toBe('Cajero');
        expect(body.token).toBeDefined();
      });
    expect(findUnique).toHaveBeenCalledWith({ where: { usuario: 'caja' } });
  });
  it.each(['incorrecta', 'inexistente', 'inactivo'])(
    'mantiene un 401 genérico: %s',
    async (kind) => {
      if (kind === 'inexistente') findUnique.mockResolvedValue(null);
      if (kind === 'inactivo')
        findUnique.mockResolvedValue({ ...worker, activo: false });
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(401)
        .expect(({ body }) =>
          expect(body.message).toBe('Credenciales inválidas'),
        );
      expect(signAsync).not.toHaveBeenCalled();
    },
  );
  it('devuelve 429 y Retry-After; ignora X-Forwarded-For y conserva otras rutas', async () => {
    for (let i = 0; i < 5; i++)
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', `10.0.0.${i}`)
        .send(credentials)
        .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '10.1.1.1')
      .send(credentials)
      .expect(429)
      .expect(({ body, headers }) => {
        expect(body.retryAfterSeconds).toBeGreaterThan(0);
        expect(body.retryAfterSeconds).toBeLessThanOrEqual(60);
        expect(Number(headers['retry-after'])).toBe(body.retryAfterSeconds);
      });
    expect(findUnique).toHaveBeenCalledTimes(5);
    for (let i = 0; i < 6; i++)
      await request(app.getHttpServer()).get('/public-probe').expect(200);
    await request(app.getHttpServer()).get('/pizzas').expect(200, []);
    await request(app.getHttpServer())
      .get('/promociones/visibles')
      .expect(200, []);
    await request(app.getHttpServer()).get('/auth/session').expect(200);
  });
  it('no penaliza fallos de base de datos', async () => {
    findUnique.mockRejectedValue(new Error('Fallo simulado'));
    for (let i = 0; i < 6; i++)
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(500);
    findUnique.mockResolvedValue(worker);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(201);
  });
});

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { validateSync } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { runInNewContext } from 'vm';
import { transpileModule, ModuleKind } from 'typescript';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { LoginDto } from '../../auth/dto/login.dto';
import { AuthService } from '../../auth/services/auth.service';
import { CreateTrabajadorDto } from '../dto/trabajador.dto';
import { TrabajadoresService } from '../services/trabajadores.service';
import { passwordValidationError } from './password-policy';

const cases: [string, unknown, boolean][] = [
  ['vacía', '', false],
  ['corta', 'a'.repeat(11), false],
  ['mínimo', 'a'.repeat(12), true],
  ['61 ASCII', 'a'.repeat(61), true],
  ['72 ASCII', 'a'.repeat(72), true],
  ['73 ASCII', 'a'.repeat(73), false],
  ['frase', 'una frase suficientemente larga', true],
  ['tildes', 'á'.repeat(36), true],
  ['tildes excedidas', 'á'.repeat(37), false],
  ['12 emojis', '🍕'.repeat(12), true],
  ['18 emojis', '🍕'.repeat(18), true],
  ['19 emojis', '🍕'.repeat(19), false],
  ['11 emojis', '🍕'.repeat(11), false],
  ['espacios', ' '.repeat(12), false],
  ['espacios Unicode', '\u2003'.repeat(12), false],
  ['espacios conservados', '  una frase válida  ', true],
  ['símbolos', '!'.repeat(12), true],
  ['números', '1'.repeat(12), true],
  ['tipo inválido', 123, false],
];

describe('Política de creación: backend y frontend', () => {
  const source = readFileSync(
    resolve(process.cwd(), '../City-pizza-frontend/src/lib/password-policy.ts'),
    'utf8',
  );
  const sandbox = { exports: {}, TextEncoder };
  runInNewContext(
    transpileModule(source, {
      compilerOptions: { module: ModuleKind.CommonJS },
    }).outputText,
    sandbox,
  );
  const frontend = (
    sandbox.exports as {
      passwordValidationError: typeof passwordValidationError;
    }
  ).passwordValidationError;

  it.each(cases)('coinciden política y DTO: %s', (_name, value, valid) => {
    const error = passwordValidationError(value);
    expect(error === null).toBe(valid);
    expect(frontend(value)).toBe(error);
    const dto = Object.assign(new CreateTrabajadorDto(), {
      usuario: 'prueba',
      nombre: 'Prueba',
      rol: 'Cajero',
      password: value,
    });
    const errors = validateSync(dto).filter(
      (entry) => entry.property === 'password',
    );
    expect(errors.length === 0).toBe(valid);
  });

  it('el HTTP de validación rechaza antes de crear y no devuelve la contraseña', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const invalid = 'corta-test';
    try {
      await pipe.transform(
        {
          usuario: 'prueba',
          nombre: 'Prueba',
          rol: 'Cajero',
          password: invalid,
        },
        { type: 'body', metatype: CreateTrabajadorDto },
      );
      throw new Error('Se esperaba rechazo');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(JSON.stringify(error.getResponse())).not.toContain(invalid);
      expect(error.getResponse().message).toContain(
        'La contraseña debe tener al menos 12 caracteres.',
      );
    }
  });
});

describe('bcrypt y compatibilidad de login sin PostgreSQL', () => {
  it('crea un hash bcrypt con factor 10 sin cambiar espacios ni devolver el hash', async () => {
    const password = '  una frase de prueba  ';
    const create = jest.fn().mockResolvedValue({
      id: 7,
      usuario: 'prueba',
      nombre: 'Prueba',
      rol: 'Cajero',
      activo: true,
    });
    const prisma = {
      trabajador: { findUnique: jest.fn().mockResolvedValue(null), create },
    } as unknown as PrismaService;
    const result = await new TrabajadoresService(prisma).crear({
      usuario: 'prueba',
      nombre: 'Prueba',
      rol: 'Cajero',
      password,
    });
    const query = create.mock.calls[0][0];
    expect(query.data.password).toBeUndefined();
    expect(query.data.passHash).not.toBe(password);
    expect(bcrypt.getRounds(query.data.passHash)).toBe(10);
    expect(await bcrypt.compare(password, query.data.passHash)).toBe(true);
    expect(await bcrypt.compare(password.trim(), query.data.passHash)).toBe(
      false,
    );
    expect(query.select).not.toHaveProperty('passHash');
    expect(result).not.toHaveProperty('passHash');
    expect(result).not.toHaveProperty('password');
  });

  it.each([
    ['histórica corta', 'abc1'],
    ['nueva 61 ASCII', 'a'.repeat(61)],
    ['nueva 72 ASCII', 'a'.repeat(72)],
    ['histórica Unicode', 'á'.repeat(60)],
  ])('acepta login: %s', async (_label, password) => {
    const dto = Object.assign(new LoginDto(), { usuario: 'prueba', password });
    expect(validateSync(dto)).toHaveLength(0);
    const passHash = await bcrypt.hash(password, 10);
    const prisma = {
      trabajador: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          usuario: 'prueba',
          nombre: 'Prueba',
          rol: 'Cajero',
          activo: true,
          passHash,
        }),
      },
    } as unknown as PrismaService;
    const signAsync = jest.fn().mockResolvedValue('token-simulado');
    const auth = new AuthService(
      prisma,
      { signAsync } as unknown as JwtService,
      {
        getOrThrow: jest.fn().mockReturnValue('configuracion-de-prueba'),
      } as unknown as ConfigService,
    );
    const result = await auth.login(dto);
    expect(signAsync).toHaveBeenCalledTimes(1);
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passHash');
  });
  it('conserva el límite de 72 caracteres del DTO de login', () => {
    expect(
      validateSync(
        Object.assign(new LoginDto(), {
          usuario: 'prueba',
          password: 'a'.repeat(73),
        }),
      ),
    ).not.toHaveLength(0);
  });
});

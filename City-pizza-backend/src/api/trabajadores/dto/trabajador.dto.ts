import {
  IsBoolean,
  IsEnum,
  IsString,
  MaxLength,
  Matches,
  MinLength,
  Validate,
} from 'class-validator';
import type { Rol } from '@prisma/client';
import { PasswordPolicy } from '../validators/password-policy';

export class CreateTrabajadorDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'usuario: solo minúsculas, números, punto, guion',
  })
  usuario!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre!: string;

  @IsString({ message: 'La contraseña debe ser un texto.' })
  @Validate(PasswordPolicy)
  password!: string;

  @IsEnum([
    'Admin',
    'Cajero',
    'Cocinero',
    'Repartidor',
  ] as unknown as Record<string, Rol>)
  rol!: Rol;
}

export class SetActivoDto {
  @IsBoolean()
  activo!: boolean;
}

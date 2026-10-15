import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  categoria?: string;

  @IsInt()
  @IsPositive()
  precioPersonal!: number;

  @IsInt()
  @IsPositive()
  precioMediana!: number;

  @IsInt()
  @IsPositive()
  precioFamiliar!: number;
}

export class UpdateProductoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  categoria?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  precioPersonal?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  precioMediana?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  precioFamiliar?: number;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @IsBoolean()
  destacada?: boolean;
}

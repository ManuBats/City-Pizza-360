import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePromocionDto {
  @IsOptional()
  @IsBoolean()
  pedidoOnline?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  pizzaId?: number;

  @IsOptional()
  @IsIn(['Personal', 'Mediana', 'Familiar'])
  tamano?: 'Personal' | 'Mediana' | 'Familiar';

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precioPromo!: number;

  /** Admin crea Permanentes; Cajero solo Flash (validado en servicio por rol). */
  @IsIn(['Permanente', 'Flash'])
  tipo!: 'Permanente' | 'Flash';

  /** Vigencia en horas (Flash de cajero: máx 48). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  vigenciaHoras?: number;
}

export class TogglePromocionDto {
  @IsBoolean()
  activa!: boolean;
}

export class UpdatePromocionDto {
  @IsOptional()
  @IsBoolean()
  pedidoOnline?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  pizzaId?: number | null;

  @IsOptional()
  @IsIn(['Personal', 'Mediana', 'Familiar'])
  tamano?: 'Personal' | 'Mediana' | 'Familiar' | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precioPromo?: number;

  @IsOptional()
  @IsIn(['Permanente', 'Flash'])
  tipo?: 'Permanente' | 'Flash';

  /** Vigencia en horas (Flash de cajero: máx 48). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  vigenciaHoras?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

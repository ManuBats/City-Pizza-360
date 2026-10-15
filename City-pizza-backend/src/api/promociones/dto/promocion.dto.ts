import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePromocionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsInt()
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

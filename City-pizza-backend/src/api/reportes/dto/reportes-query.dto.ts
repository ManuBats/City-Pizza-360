import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Rango de fechas locales (America/Lima) para reportes. */
export class RangoFechasDto {
  @IsOptional()
  @Matches(FECHA_ISO, { message: 'desde debe tener formato YYYY-MM-DD' })
  desde?: string;

  @IsOptional()
  @Matches(FECHA_ISO, { message: 'hasta debe tener formato YYYY-MM-DD' })
  hasta?: string;
}

export class TopProductosQueryDto extends RangoFechasDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

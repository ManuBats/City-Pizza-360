import { IsBoolean } from 'class-validator';

/** Disponibilidad de una pizza en el catálogo (Admin/Cajero). */
export class SetDisponibilidadDto {
  @IsBoolean()
  disponible!: boolean;
}

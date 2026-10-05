import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PedidoItemDto {
  @IsInt()
  @Min(1)
  pizzaId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsIn(['Personal', 'Familiar'])
  tamano!: 'Personal' | 'Familiar';
}

export class CreatePedidoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombres!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  apellidos!: string;

  @IsString()
  @Matches(/^9\d{8}$/, { message: 'celular debe tener 9 dígitos y empezar con 9' })
  celular!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  direccion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referencia?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  items!: PedidoItemDto[];
}

export class UpdateEstadoDto {
  @IsIn(['Recibido', 'Preparacion', 'Listo', 'EnCamino', 'Entregado'])
  estado!: 'Recibido' | 'Preparacion' | 'Listo' | 'EnCamino' | 'Entregado';
}

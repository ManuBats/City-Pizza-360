import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PedidoItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  pizzaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  promocionId?: number;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @IsIn(['Personal', 'Mediana', 'Familiar'])
  tamano?: 'Personal' | 'Mediana' | 'Familiar';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nota?: string;

  @IsOptional()
  @IsBoolean()
  extraQueso?: boolean;
}

export class CreatePedidoDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalEsperado?: number;

  @IsOptional()
  @IsUUID('4')
  claveSolicitud?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombres!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  apellidos!: string;

  @IsString()
  @Matches(/^9\d{8}$/, {
    message: 'celular debe tener 9 dígitos y empezar con 9',
  })
  celular!: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referencia?: string;

  @IsOptional()
  @IsIn(['Delivery', 'Recojo', 'Mesa'])
  tipoEntrega?: 'Delivery' | 'Recojo' | 'Mesa';

  @IsOptional()
  @IsIn(['Efectivo', 'Yape'])
  metodoPago?: 'Efectivo' | 'Yape';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mesa?: number;

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

export class AsignarRepartidorDto {
  @IsInt()
  @Min(1)
  repartidorId!: number;
}

export class VerificarPagoDto {
  @IsIn(['Verificado', 'Rechazado'])
  estadoPago!: 'Verificado' | 'Rechazado';
}

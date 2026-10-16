import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import { TrabajadoresService } from '../services/trabajadores.service';
import { CreateTrabajadorDto, SetActivoDto } from '../dto/trabajador.dto';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class TrabajadoresController {
  constructor(private readonly trabajadores: TrabajadoresService) {}

  @Get()
  findAll() {
    return this.trabajadores.findAll();
  }

  @Get('repartidores')
  @Roles('Admin', 'Cocinero')
  repartidores() {
    return this.trabajadores.repartidores();
  }

  @Post()
  crear(@Body() dto: CreateTrabajadorDto) {
    return this.trabajadores.crear(dto);
  }

  @Patch(':usuario/activo')
  setActivo(@Param('usuario') usuario: string, @Body() dto: SetActivoDto) {
    return this.trabajadores.setActivo(usuario, dto.activo);
  }
}

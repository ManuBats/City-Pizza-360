import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { TrabajadoresService } from './trabajadores.service';
import { CreateTrabajadorDto, SetActivoDto } from './trabajador.dto';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class TrabajadoresController {
  constructor(private readonly trabajadores: TrabajadoresService) {}

  @Get()
  findAll() {
    return this.trabajadores.findAll();
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

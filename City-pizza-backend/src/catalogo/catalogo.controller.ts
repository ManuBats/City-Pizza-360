import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CatalogoService } from './catalogo.service';

@Controller('pizzas')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get()
  findAll() {
    return this.catalogo.findAll();
  }

  @Patch(':id/disponibilidad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  setDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { disponible: boolean },
  ) {
    return this.catalogo.setDisponibilidad(id, body.disponible === true);
  }
}

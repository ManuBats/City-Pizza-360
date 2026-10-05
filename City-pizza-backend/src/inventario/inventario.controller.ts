import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { InventarioService } from './inventario.service';

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get()
  @Roles('Admin', 'Cajero')
  findAll() {
    return this.inventario.findAll();
  }

  @Get('alertas')
  @Roles('Admin', 'Cajero')
  alertas() {
    return this.inventario.alertas();
  }

  @Patch(':id/ajustar')
  @Roles('Admin')
  ajustar(@Param('id', ParseIntPipe) id: number, @Body() body: { delta: number }) {
    return this.inventario.ajustar(id, Number(body.delta) || 0);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type JwtPayload } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import { PromocionesService } from '../services/promociones.service';
import { CreatePromocionDto, TogglePromocionDto } from '../dto/promocion.dto';

@Controller('promociones')
export class PromocionesController {
  constructor(private readonly promos: PromocionesService) {}

  /** Vitrina del cliente (sin token). */
  @Get('visibles')
  visibles() {
    return this.promos.visibles();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  findAll() {
    return this.promos.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  crear(@Body() dto: CreatePromocionDto, @Req() req: { user: JwtPayload }) {
    return this.promos.crear(dto, req.user.rol);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  toggle(@Param('id', ParseIntPipe) id: number, @Body() dto: TogglePromocionDto) {
    return this.promos.toggle(id, dto.activa);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.promos.eliminar(id);
  }
}

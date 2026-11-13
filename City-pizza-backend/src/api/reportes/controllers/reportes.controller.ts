import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import {
  RangoFechasDto,
  TopProductosQueryDto,
} from '../dto/reportes-query.dto';
import { ReportesService } from '../services/reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('resumen')
  resumen() {
    return this.reportes.resumen();
  }

  @Get('ventas-por-dia')
  ventasPorDia(@Query() query: RangoFechasDto) {
    return this.reportes.ventasPorDia(query);
  }

  @Get('top-productos')
  topProductos(@Query() query: TopProductosQueryDto) {
    return this.reportes.topProductos(query);
  }
}

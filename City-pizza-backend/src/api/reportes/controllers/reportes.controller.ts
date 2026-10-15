import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
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
}

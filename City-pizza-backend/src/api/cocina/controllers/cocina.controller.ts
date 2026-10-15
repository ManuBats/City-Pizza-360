import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import { CocinaService } from '../services/cocina.service';

@Controller('cocina')
export class CocinaController {
  constructor(private readonly cocina: CocinaService) {}

  @Get('cola')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cocinero')
  cola() {
    return this.cocina.cola();
  }
}

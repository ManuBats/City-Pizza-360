import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CocinaService } from './cocina.service';

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

import { Module } from '@nestjs/common';
import { PromocionesController } from './controllers/promociones.controller';
import { PromocionesService } from './services/promociones.service';

@Module({
  controllers: [PromocionesController],
  providers: [PromocionesService],
})
export class PromocionesModule {}

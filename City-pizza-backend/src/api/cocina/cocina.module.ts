import { Module } from '@nestjs/common';
import { CocinaController } from './controllers/cocina.controller';
import { CocinaService } from './services/cocina.service';

@Module({
  controllers: [CocinaController],
  providers: [CocinaService],
})
export class CocinaModule {}

import { Module } from '@nestjs/common';
import { CatalogoController } from './controllers/catalogo.controller';
import { CatalogoService } from './services/catalogo.service';

@Module({
  controllers: [CatalogoController],
  providers: [CatalogoService],
})
export class CatalogoModule {}

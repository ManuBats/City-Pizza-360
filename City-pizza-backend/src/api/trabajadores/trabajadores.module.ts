import { Module } from '@nestjs/common';
import { TrabajadoresController } from './controllers/trabajadores.controller';
import { TrabajadoresService } from './services/trabajadores.service';

@Module({
  controllers: [TrabajadoresController],
  providers: [TrabajadoresService],
})
export class TrabajadoresModule {}

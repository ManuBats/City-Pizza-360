import { Module } from '@nestjs/common';
import { InventarioController } from './controllers/inventario.controller';
import { InventarioService } from './services/inventario.service';

@Module({
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}

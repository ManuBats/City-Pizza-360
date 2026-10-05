import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { CocinaModule } from './cocina/cocina.module';
import { CommonModule } from './common/common.module';
import { InventarioModule } from './inventario/inventario.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './reportes/reportes.module';
import { TrabajadoresModule } from './trabajadores/trabajadores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    CatalogoModule,
    PedidosModule,
    CocinaModule,
    InventarioModule,
    ReportesModule,
    TrabajadoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

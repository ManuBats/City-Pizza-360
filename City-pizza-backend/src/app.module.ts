import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/auth/auth.module';
import { CatalogoModule } from './api/catalogo/catalogo.module';
import { CocinaModule } from './api/cocina/cocina.module';
import { MiddlewaresModule } from './middlewares/middlewares.module';
import { InventarioModule } from './api/inventario/inventario.module';
import { PedidosModule } from './api/pedidos/pedidos.module';
import { PrismaModule } from './config/prisma/prisma.module';
import { PromocionesModule } from './api/promociones/promociones.module';
import { ReportesModule } from './api/reportes/reportes.module';
import { TrabajadoresModule } from './api/trabajadores/trabajadores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MiddlewaresModule,
    AuthModule,
    CatalogoModule,
    PedidosModule,
    CocinaModule,
    PromocionesModule,
    InventarioModule,
    ReportesModule,
    TrabajadoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

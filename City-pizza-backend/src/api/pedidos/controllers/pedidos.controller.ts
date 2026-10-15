import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { EstadoPago } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { COMPROBANTE_MAX_BYTES } from '../../../constants/negocio.constants';
import { JwtAuthGuard, type JwtPayload } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import {
  AsignarRepartidorDto,
  CreatePedidoDto,
  UpdateEstadoDto,
  VerificarPagoDto,
} from '../dto/pedido.dto';
import { PedidosService } from '../services/pedidos.service';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  crear(@Body() dto: CreatePedidoDto) {
    return this.pedidos.crear(dto);
  }

  @Get('tracking')
  tracking(@Query('codigo') codigo: string, @Query('celular') celular: string) {
    return this.pedidos.tracking(codigo, celular);
  }

  @Post(':id/comprobante')
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: diskStorage({
        destination: './uploads/comprobantes',
        filename: (_req, file, cb) => {
          const name = `cp-${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: COMPROBANTE_MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Solo imágenes JPG/PNG/WebP'), false);
      },
    }),
  )
  subirComprobante(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Falta la imagen del comprobante');
    return this.pedidos.subirComprobante(id, file.filename);
  }

  @Get('mis-entregas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Repartidor', 'Admin')
  misEntregas(@Req() req: { user: JwtPayload }) {
    return this.pedidos.misEntregas(req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  findAll() {
    return this.pedidos.findAll();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero', 'Cocinero', 'Repartidor')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
  ) {
    return this.pedidos.cambiarEstado(id, dto.estado);
  }

  @Patch(':id/asignar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cocinero')
  asignar(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarRepartidorDto) {
    return this.pedidos.asignarRepartidor(id, dto.repartidorId);
  }

  @Patch(':id/pago')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  verificarPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerificarPagoDto,
  ) {
    return this.pedidos.verificarPago(id, dto.estadoPago as EstadoPago);
  }
}

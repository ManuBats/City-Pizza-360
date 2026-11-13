import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { EstadoPago } from '@prisma/client';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { COMPROBANTE_MAX_BYTES } from '../../../constants/negocio.constants';
import {
  JwtAuthGuard,
  type JwtPayload,
} from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import {
  AsignarRepartidorDto,
  CreatePedidoDto,
  UpdateEstadoDto,
  VerificarPagoDto,
} from '../dto/pedido.dto';
import { PedidosService } from '../services/pedidos.service';

const comprobanteInterceptor = FileInterceptor('comprobante', {
  storage: memoryStorage(),
  limits: { fileSize: COMPROBANTE_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new BadRequestException('Solo imágenes JPG/PNG/WebP'), false);
  },
});

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  crear(@Body() dto: CreatePedidoDto) {
    return this.pedidos.crear(dto);
  }

  @Post('yape')
  @UseInterceptors(comprobanteInterceptor)
  async crearYape(
    @Body('pedido') datos: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Falta la imagen del comprobante');
    let contenido: unknown;
    try {
      contenido = JSON.parse(datos);
    } catch {
      throw new BadRequestException('Datos del pedido inválidos');
    }
    if (!contenido || typeof contenido !== 'object' || Array.isArray(contenido))
      throw new BadRequestException('Datos del pedido inválidos');
    const dto = await new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }).transform(contenido, { type: 'body', metatype: CreatePedidoDto });
    return this.pedidos.crear({ ...dto, metodoPago: 'Yape' }, undefined, file.buffer);
  }

  @Post('mesa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  crearMesa(@Body() dto: CreatePedidoDto, @Req() req: { user: JwtPayload }) {
    return this.pedidos.crear({ ...dto, tipoEntrega: 'Mesa' }, req.user);
  }

  @Get('tracking')
  tracking(@Query('codigo') codigo: string, @Query('celular') celular: string) {
    return this.pedidos.tracking(codigo, celular);
  }

  @Post(':id/comprobante')
  @UseInterceptors(comprobanteInterceptor)
  subirComprobante(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-comprobante-token') token: string | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Falta la imagen del comprobante');
    return this.pedidos.subirComprobante(id, token, file.buffer);
  }

  @Get(':id/comprobante')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  async leerComprobante(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const archivo = await this.pedidos.leerComprobante(id);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(archivo.bytes, { type: archivo.tipo });
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
    @Req() req: { user: JwtPayload },
  ) {
    return this.pedidos.cambiarEstado(id, dto.estado, req.user);
  }

  @Patch(':id/asignar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cocinero')
  asignar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarRepartidorDto,
  ) {
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

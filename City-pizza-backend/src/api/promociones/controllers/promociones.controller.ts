import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PRODUCTO_IMG_MAX_BYTES } from '../../../constants/negocio.constants';
import {
  JwtAuthGuard,
  type JwtPayload,
} from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import { PromocionesService } from '../services/promociones.service';
import {
  CreatePromocionDto,
  TogglePromocionDto,
  UpdatePromocionDto,
} from '../dto/promocion.dto';

@Controller('promociones')
export class PromocionesController {
  constructor(private readonly promos: PromocionesService) {}

  /** Vitrina del cliente (sin token). */
  @Get('visibles')
  visibles() {
    return this.promos.visibles();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  findAll() {
    return this.promos.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  crear(@Body() dto: CreatePromocionDto, @Req() req: { user: JwtPayload }) {
    return this.promos.crear(dto, req.user.rol);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  toggle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TogglePromocionDto,
  ) {
    return this.promos.toggle(id, dto.activa);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromocionDto,
  ) {
    return this.promos.actualizar(id, dto);
  }

  @Post(':id/imagen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: PRODUCTO_IMG_MAX_BYTES, files: 1 },
    }),
  )
  subirImagen(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Falta la imagen de la promoción');
    return this.promos.subirImagen(id, file.buffer);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.promos.eliminar(id);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PRODUCTO_IMG_MAX_BYTES } from '../../../constants/negocio.constants';
import { JwtAuthGuard } from '../../../middlewares/jwt-auth.guard';
import { Roles } from '../../../middlewares/roles.decorator';
import { RolesGuard } from '../../../middlewares/roles.guard';
import { CreateProductoDto, UpdateProductoDto } from '../dto/producto.dto';
import { CatalogoService } from '../services/catalogo.service';

@Controller('pizzas')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get()
  findAll() {
    return this.catalogo.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  crear(@Body() dto: CreateProductoDto) {
    return this.catalogo.crear(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.catalogo.actualizar(id, dto);
  }

  @Post(':id/imagen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: './uploads/productos',
        filename: (_req, file, cb) => {
          const name = `pizza-${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: PRODUCTO_IMG_MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Solo imágenes JPG/PNG/WebP'), false);
      },
    }),
  )
  subirImagen(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Falta la imagen del producto');
    return this.catalogo.subirImagen(id, file.filename);
  }

  @Patch(':id/disponibilidad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Cajero')
  setDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { disponible: boolean },
  ) {
    return this.catalogo.setDisponibilidad(id, body.disponible === true);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.catalogo.eliminar(id);
  }
}

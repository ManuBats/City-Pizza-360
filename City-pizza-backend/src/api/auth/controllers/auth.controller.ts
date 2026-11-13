import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  JwtAuthGuard,
  type JwtPayload,
} from '../../../middlewares/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { LoginAttemptsService } from '../services/login-attempts.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly attempts: LoginAttemptsService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return await this.attempts.run(
        dto.usuario,
        req.socket.remoteAddress,
        () => this.auth.login(dto),
      );
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) {
        const body = error.getResponse() as { retryAfterSeconds: number };
        res.setHeader('Retry-After', body.retryAfterSeconds);
      }
      throw error;
    }
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  session(@Req() req: { user: JwtPayload }) {
    return this.auth.session(req.user.sub);
  }
}

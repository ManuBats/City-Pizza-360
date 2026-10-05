import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type JwtPayload } from '../common/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  session(@Req() req: { user: JwtPayload }) {
    return this.auth.session(req.user.sub);
  }
}

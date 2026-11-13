import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LoginAttemptsService } from './services/login-attempts.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LoginAttemptsService],
})
export class AuthModule {}

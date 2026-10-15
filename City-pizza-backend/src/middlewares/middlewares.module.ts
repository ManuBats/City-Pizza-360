import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/** Middlewares transversales (equivale a middlewares/ de CCA): auth JWT + RBAC. */
@Global()
@Module({
  providers: [JwtService, JwtAuthGuard, RolesGuard],
  exports: [JwtService, JwtAuthGuard, RolesGuard],
})
export class MiddlewaresModule {}

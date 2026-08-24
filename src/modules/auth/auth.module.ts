import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '@/modules/users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { Auth, AuthSchema } from './schemas/auth.schema';
import { AuthCredentialsService } from './services/auth-credentials.service';
import { AuthGoogleService } from './services/auth-google.service';
import { AuthSecurityService } from './services/auth-security.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthTokenService } from './services/auth-token.service';
import { AuthTwoFactorService } from './services/auth-two-factor.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { RefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { RefreshTokenGuard } from './guards/refresh.token.guard';
import { RolesRepository } from './repositories/roles.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
    PassportModule,
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    RolesRepository,
    AuthCredentialsService,
    AuthGoogleService,
    AuthSecurityService,
    AuthSessionService,
    AuthTokenService,
    AuthTwoFactorService,
    JwtAccessStrategy,
    RefreshTokenStrategy,
    RolesGuard,
    PermissionsGuard,
    RefreshTokenGuard,
  ],
  exports: [AuthTokenService, AuthSessionService, RolesGuard, PermissionsGuard],
})
export class AuthModule {}

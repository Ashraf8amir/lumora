import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';

import { Auth, AuthSchema } from './schemas/auth.schema';
import { AuthRepository } from './repositories/auth.repository';

import { AuthService } from './services/auth.service';
import { TokenService } from './services/auth-token.service';
import { TwoFactorAuthService } from './services/auth-two-factor.service';
import { GoogleAuthService } from './services/auth-google.service';

import { AuthController } from './controllers/auth.controller';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    TwoFactorAuthService,
    GoogleAuthService,

    AuthRepository,

    JwtAccessStrategy,
    JwtRefreshStrategy,

    JwtAccessGuard,
    RolesGuard,
  ],
  exports: [AuthService, TokenService, JwtAccessGuard, RolesGuard],
})
export class AuthModule {}

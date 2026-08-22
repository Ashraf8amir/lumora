import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UAParser } from 'ua-parser-js';
import { Types } from 'mongoose';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { GoogleLoginDto } from './dto/request/google-login.dto';
import { LoginDto } from './dto/request/login.dto';
import { RegisterDto } from './dto/request/register.dto';
import { TwoFactorCodeDto } from './dto/request/two-factor.dto';
import { AuthTokensResponseDto } from './dto/response/auth-tokens.response.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { TwoFactorGuard } from './guards/two-factor.guard';
import { SessionContext } from './interfaces/active-session.interface';
import { AuthTokenService } from './services/auth-token.service';

const REFRESH_COOKIE_NAME = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authTokenService: AuthTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, this.extractSessionContext(req));
    return this.respondWithTokens(result, res);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.extractSessionContext(req));

    if (result.requiresTwoFactor) {
      return { requiresTwoFactor: true, mfaToken: result.mfaToken };
    }

    return this.respondWithTokens(result, res);
  }

  @Public()
  @UseGuards(TwoFactorGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactorLogin(
    @Body() dto: TwoFactorCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyTwoFactorLogin(
      (req as any).mfaUserId,
      dto.code,
      dto.isBackupCode ?? false,
      this.extractSessionContext(req),
    );

    return this.respondWithTokens(result, res);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(
    @Body() dto: GoogleLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithGoogle(
      dto.idToken,
      this.extractSessionContext(req),
    );

    return this.respondWithTokens(result, res);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken } = req.user as { refreshToken: string };

    const result = await this.authService.refreshTokens(refreshToken);
    return this.respondWithTokens(result, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: { userId: string; sessionId: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authHeader = req.get('Authorization')?.replace('Bearer ', '').trim();
    const jti = authHeader
      ? (await this.authTokenService.verifyAccessToken(authHeader)).jti
      : undefined;

    await this.authService.logout(new Types.ObjectId(user.userId), user.sessionId, jti);
    res.clearCookie(REFRESH_COOKIE_NAME);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(new Types.ObjectId(userId));
    res.clearCookie(REFRESH_COOKIE_NAME);
  }

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  async setupTwoFactor(@CurrentUser() user: { userId: string }) {
    return this.authService.setupTwoFactor(new Types.ObjectId(user.userId), (user as any).email);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enableTwoFactor(
    @CurrentUser('userId') userId: string,
    @Body() dto: TwoFactorCodeDto & { secret: string },
  ) {
    return this.authService.enableTwoFactor(new Types.ObjectId(userId), dto.secret, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disableTwoFactor(@CurrentUser('userId') userId: string, @Body() dto: TwoFactorCodeDto) {
    await this.authService.disableTwoFactor(new Types.ObjectId(userId), dto.code);
  }

  @Get('sessions')
  async getSessions(@CurrentUser('userId') _userId: string) {
    return { sessions: [] };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private extractSessionContext(req: Request): SessionContext {
    const userAgent = req.get('user-agent') ?? '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      deviceId: (req.get('x-device-id') as string) ?? req.ip ?? 'unknown-device',
      deviceName: req.get('x-device-name') as string,
      ipAddress: req.ip,
      userAgent: userAgent,
      browser: result.browser.name ?? 'Unknown',
      os: result.os.name ?? 'Unknown',
      deviceType: result.device.type ?? 'desktop',
      isPrimary: req.get('x-is-primary') === 'true',
    };
  }

  private respondWithTokens(
    result: AuthTokensResponseDto & { rawRefreshToken?: string },
    res: Response,
  ) {
    if (result.rawRefreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'strict',
        expires: result.refreshTokenExpiresAt,
        path: '/auth',
      });
    }

    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
    };
  }
}

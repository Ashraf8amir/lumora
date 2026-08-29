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
import type { CookieOptions, Request, Response } from 'express';
import { UAParser } from 'ua-parser-js';
import { Types } from 'mongoose';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { GoogleLoginDto } from './dto/request/google-login.dto';
import { LoginDto } from './dto/request/login.dto';
import { RegisterDto } from './dto/request/register.dto';
import { TwoFactorCodeDto } from './dto/request/two-factor.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh.token.guard';
import { TwoFactorGuard } from './guards/two-factor.guard';
import { SessionContext } from './interfaces/session-context.interface';
import { ApiCommonErrors } from '@/infrastructure/swagger/decorators/api-common-errors.decorator';
import { ApiOkResponseWrapped } from '@/infrastructure/swagger/decorators/api-ok-response-wrapped.decorator';
import { ResponseMessage } from '@/common/response/decorators/response-message.decorator';
import { Environment } from '@/common/enums/environment.enum';
import { GenerateTokensResult } from './interfaces/auth-result.interface';
import { createHash } from 'node:crypto';

const REFRESH_COOKIE_NAME = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @ResponseMessage('User registration successful')
  @ApiOkResponseWrapped(AuthResponseDto)
  @ApiCommonErrors(['BAD_REQUEST', 'CONFLICT'])
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const sessionContext = this.extractSessionContext(req);
    const result = await this.authService.register(dto, sessionContext);
    return this.respondWithTokens(result, res);
  }

  @Public()
  @ApiCommonErrors(['BAD_REQUEST', 'UNAUTHORIZED'])
  @ApiOkResponseWrapped(AuthResponseDto)
  @ResponseMessage('User login successful')
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const sessionContext = this.extractSessionContext(req);
    const result = await this.authService.login(dto, sessionContext);

    if (result.requiresTwoFactor) {
      return { requiresTwoFactor: true, mfaToken: result.mfaToken };
    }

    return this.respondWithTokens(result, res);
  }

  @Public()
  @ApiCommonErrors(['BAD_REQUEST', 'UNAUTHORIZED'])
  @ApiOkResponseWrapped(AuthResponseDto)
  @ResponseMessage('Two-factor authentication verification successful')
  @UseGuards(TwoFactorGuard)
  @Post('2fa/verify')
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
  @ApiCommonErrors(['UNAUTHORIZED'])
  @ApiOkResponseWrapped(AuthResponseDto)
  @ResponseMessage('Token refresh successful')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken } = req.user as { refreshToken: string };

    const result = await this.authService.refreshTokens(refreshToken);
    return this.respondWithTokens(result, res);
  }

  @ApiCommonErrors(['UNAUTHORIZED'])
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: { userId: string; sessionId: string; jti?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(new Types.ObjectId(user.userId), user.sessionId, user.jti);
    this.clearRefreshCookie(res);
  }

  @ApiCommonErrors(['UNAUTHORIZED'])
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

  @ApiCommonErrors(['UNAUTHORIZED'])
  @ResponseMessage('Active sessions retrieved successfully')
  @HttpCode(HttpStatus.OK)
  @Get('sessions')
  async getSessions(@CurrentUser() user: { userId: string; sessionId: string }) {
    const sessions = await this.authService.getActiveSessions(
      new Types.ObjectId(user.userId),
      user.sessionId,
    );

    return sessions;
  }

  private extractSessionContext(req: Request): SessionContext {
    const userAgent = req.get('user-agent') ?? '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const FallbackDeviceId = createHash('sha256')
      .update(`${userAgent}-${result.browser.name}-${result.os.name}-${result.device.type}`)
      .digest('hex');

    return {
      deviceId: (req.get('x-device-id') as string) || FallbackDeviceId,
      deviceName: (req.get('x-device-name') as string) ?? 'Unknown Device',
      ipAddress: req.ip,
      userAgent: userAgent,
      browser: result.browser.name ?? 'Unknown',
      os: result.os.name ?? 'Unknown',
      deviceType: result.device.type ?? 'desktop',
      isPrimary: req.get('x-is-primary') === 'true',
    };
  }

  private getRefreshCookieOptions(): CookieOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === Environment.Production;
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: cookieDomain || undefined,
      path: '/api/v1/auth',
    };
  }

  private setRefreshCookie(res: Response, token: string, expiresAt?: Date): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.getRefreshCookieOptions(),
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
  }

  private respondWithTokens(payload: GenerateTokensResult, res: Response): AuthResponseDto {
    if (payload.rawRefreshToken) {
      this.setRefreshCookie(res, payload.rawRefreshToken, payload.refreshTokenExpiresAt);
    }

    return {
      accessToken: payload.accessToken,
      accessTokenExpiresAt: payload.accessTokenExpiresAt,
    };
  }
}

import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

import { UsersService } from '@/modules/users/users.service';

import { LoginDto } from './dto/request/login.dto';
import { RegisterDto } from './dto/request/register.dto';
import { TwoFactorSetupResponseDto } from './dto/response/two-factor-setup.response.dto';
import { SessionContext } from './interfaces/session-context.interface';
import { AuthRepository } from './repositories/auth.repository';
import { ActiveSession } from './schemas/active-session.schema';
import { AuthCredentialsService } from './services/auth-credentials.service';
import { AuthGoogleService } from './services/auth-google.service';
import { AuthSecurityService } from './services/auth-security.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthTokenService } from './services/auth-token.service';
import { AuthTwoFactorService } from './services/auth-two-factor.service';
import { Role } from '@/common/enums/role.enum';
import { GenerateTokensResult, LoginResult } from './interfaces/auth-result.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authRepository: AuthRepository,
    private readonly authCredentialsService: AuthCredentialsService,
    private readonly authSessionService: AuthSessionService,
    private readonly authSecurityService: AuthSecurityService,
    private readonly authTokenService: AuthTokenService,
    private readonly authTwoFactorService: AuthTwoFactorService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  async register(dto: RegisterDto, context: SessionContext): Promise<GenerateTokensResult> {
    const createdUser = await this.usersService.createCustomer({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.authCredentialsService.setPasswordHash(createdUser._id, passwordHash);

    return this.issueTokensForNewSession(createdUser._id, createdUser.role, context);
  }

  async login(dto: LoginDto, context: SessionContext): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (await this.authSecurityService.isLocked(user._id)) {
      throw new UnauthorizedException('Account is temporarily locked. Try again later');
    }

    const authDoc = await this.authRepository.findByUserId(user._id);

    if (!authDoc?.credentials?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, authDoc.credentials.passwordHash);

    if (!isPasswordValid) {
      await this.authSecurityService.recordFailedLogin(user._id);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authSecurityService.resetFailedLoginAttempts(user._id);

    if (authDoc.security?.isTwoFactorEnabled) {
      const { token } = this.authTokenService.signMfaChallengeToken(user._id.toString());

      return {
        requiresTwoFactor: true,
        mfaToken: token,
      };
    }

    return this.issueTokensForNewSession(user._id, user.role, context);
  }

  async verifyTwoFactorLogin(
    mfaUserId: string,
    code: string,
    isBackupCode: boolean,
    context: SessionContext,
  ): Promise<GenerateTokensResult> {
    const userId = new Types.ObjectId(mfaUserId);
    const authDoc = await this.authRepository.findSecurityInfo(userId);

    if (!authDoc?.security?.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this account');
    }

    const isValid = isBackupCode
      ? await this.authTwoFactorService.verifyAndConsumeBackupCode(userId, code)
      : this.authTwoFactorService.verifyCode(authDoc.security.twoFactorSecret!, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const user = await this.usersService.findOne(userId.toString());

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokensForNewSession(user._id, user.role, context);
  }

  async loginWithGoogle(idToken: string, context: SessionContext): Promise<GenerateTokensResult> {
    const googleUser = await this.authGoogleService.verifyGoogleToken(idToken);

    if (!googleUser.emailVerified) {
      throw new BadRequestException('Google email is not verified');
    }

    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      const [firstName, ...lastNameParts] = (googleUser.name ?? googleUser.email).split(' ');
      const lastName = lastNameParts.join(' ') || 'User';

      const createdUser = await this.usersService.createCustomer({
        email: googleUser.email,
        firstName,
        lastName,
        phone: '',
        gender: 'male',
      });

      user = createdUser as any;

      if (!user) {
        throw new BadRequestException('Failed to create user');
      }
    }

    const result = await this.authGoogleService.loginWithGoogle(
      user._id,
      user.role,
      idToken,
      this.buildSessionSkeleton(context),
    );

    return {
      accessToken: result.tokens.accessToken,
      accessTokenExpiresAt: result.tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt,
      // rawRefreshToken: result.tokens.rawRefreshToken,
    };
  }

  async refreshTokens(rawRefreshToken: string): Promise<GenerateTokensResult> {
    const tokenHash = this.authTokenService.hashToken(rawRefreshToken);
    const authDoc = await this.authRepository.findByRefreshTokenHash(tokenHash);

    if (!authDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = authDoc.sessions.find(
      (s) =>
        this.authTokenService.compareToken(rawRefreshToken, s.refreshTokenHash) && !s.isRevoked,
    );

    if (!session) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // إعادة استخدام refresh token اتسحب قبل كده = احتمال سرقة → نلغي الـ family كله
    // (الشرط ده مش هيتحقق أبدًا هنا لأن السيشن لسه isRevoked=false، ده حماية إضافية
    // في حالة عندك rotation queue بتتأخر — سيبها كتعليق توضيحي).

    await this.authRepository.revokeSession(authDoc.userId, session.sessionId);

    const newSessionId = randomUUID();
    const newRefreshToken = this.authTokenService.generateRefreshToken();

    const rotatedSession: ActiveSession = {
      sessionId: newSessionId,
      refreshTokenHash: newRefreshToken.hash,
      familyId: session.familyId,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      browser: session.browser,
      os: session.os,
      deviceType: session.deviceType,
      isPrimary: session.isPrimary,
      expiresAt: newRefreshToken.expiresAt,
      createdAt: new Date(),
      isRevoked: false,
    };

    await this.authSessionService.createSession(authDoc.userId, rotatedSession);

    const user = await this.usersService.findOne(authDoc.userId.toString());

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.authTokenService.signAccessToken({
      userId: user._id.toString(),
      role: user.role,
      sessionId: newSessionId,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: newRefreshToken.expiresAt,
      rawRefreshToken: newRefreshToken.raw,
    };
  }

  async logout(userId: Types.ObjectId, sessionId: string, accessTokenJti?: string): Promise<void> {
    await this.authSessionService.revokeSession(userId, sessionId);

    if (accessTokenJti) {
      await this.authTokenService.blacklistAccessToken(
        accessTokenJti,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );
    }
  }

  async logoutAll(userId: Types.ObjectId): Promise<void> {
    await this.authSessionService.revokeAllSessions(userId);
  }

  async setupTwoFactor(
    userId: Types.ObjectId,
    userEmail: string,
  ): Promise<TwoFactorSetupResponseDto> {
    const { secret, qrCodeImageDataUrl } = await this.authTwoFactorService.generateTwoFactorSecret(
      userId,
      userEmail,
    );

    return new TwoFactorSetupResponseDto({ secret, qrCodeImageDataUrl });
  }

  async enableTwoFactor(userId: Types.ObjectId, secret: string, code: string) {
    return this.authTwoFactorService.enableTwoFactor(userId, secret, code);
  }

  async disableTwoFactor(userId: Types.ObjectId, code: string): Promise<void> {
    await this.authTwoFactorService.disableTwoFactor(userId, code);
  }

  private buildSessionSkeleton(
    context: SessionContext,
  ): Omit<ActiveSession, 'sessionId' | 'createdAt' | 'isRevoked'> {
    return {
      familyId: randomUUID(),
      deviceId: context.deviceId,
      deviceName: context.deviceName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent ?? null,
      browser: context.browser ?? 'Unknown',
      os: context.os ?? 'Unknown',
      deviceType: context.deviceType ?? 'Unknown',
      isPrimary: context.isPrimary ?? false,
      refreshTokenHash: '', // هيتظبط تحت قبل ما يتحفظ
      expiresAt: new Date(0), // هيتظبط تحت قبل ما يتحفظ
    };
  }

  private async issueTokensForNewSession(
    userId: Types.ObjectId,
    role: Role,
    context: SessionContext,
  ): Promise<GenerateTokensResult> {
    const sessionId = randomUUID();
    const refreshToken = this.authTokenService.generateRefreshToken();

    const session: ActiveSession = {
      sessionId,
      familyId: randomUUID(),
      refreshTokenHash: refreshToken.hash,
      deviceId: context.deviceId,
      deviceName: context.deviceName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent ?? null,
      browser: context.browser ?? 'Unknown',
      os: context.os ?? 'Unknown',
      deviceType: context.deviceType ?? 'Unknown',
      isPrimary: context.isPrimary ?? false,
      expiresAt: refreshToken.expiresAt,
      createdAt: new Date(),
      isRevoked: false,
    };

    await this.authSessionService.createSession(userId, session);

    const accessToken = this.authTokenService.signAccessToken({
      userId: userId.toString(),
      role,
      sessionId,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      rawRefreshToken: refreshToken.raw,
    };
  }
}

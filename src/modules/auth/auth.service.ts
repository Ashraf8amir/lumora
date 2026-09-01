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
import { GoogleIdentity, GoogleAuthenticatedUser } from './interfaces/google.interface';
import { AuthProvider } from './enums/auth-provider.enum';

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

    const remainingLockTime = await this.authSecurityService.getLockTtl(user._id);
    if (remainingLockTime > 0) {
      const minutes = Math.ceil(remainingLockTime / 60);
      throw new UnauthorizedException(
        `Account is temporarily locked. Try again in ${minutes} minute(s)`,
      );
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
    userId: Types.ObjectId,
    code: string,
    isBackupCode: boolean,
    context: SessionContext,
  ): Promise<GenerateTokensResult> {
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

  async loginWithGoogle(idToken: string, context: SessionContext): Promise<LoginResult> {
    const googleIdentity = await this.authGoogleService.verifyGoogleToken(idToken);

    const user = await this.findOrCreateGoogleUser(googleIdentity);

    await this.authCredentialsService.setProvider(
      user.userId,
      AuthProvider.GOOGLE,
      googleIdentity.googleId,
    );

    const security = await this.authRepository.findSecurityInfo(user.userId);
    const isTwoFactorEnabled = security?.security?.isTwoFactorEnabled === true;

    if (isTwoFactorEnabled) {
      const { token } = this.authTokenService.signMfaChallengeToken(user.userId.toString());

      return {
        requiresTwoFactor: true,
        mfaToken: token,
      };
    }

    return this.issueTokensForNewSession(user.userId, user.role, context);
  }

  async refreshTokens(rawRefreshToken: string): Promise<GenerateTokensResult> {
    const tokenHash = this.authTokenService.hashToken(rawRefreshToken);
    const authDoc = await this.authRepository.findByRefreshTokenHash(tokenHash);

    if (!authDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = authDoc.sessions.find((s) =>
      this.authTokenService.compareToken(tokenHash, s.refreshTokenHash),
    );

    if (!session) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (session.expiresAt <= new Date()) {
      await this.authRepository.deleteSessionFamily(authDoc.userId, session.familyId);
      throw new UnauthorizedException(
        'Refresh token has expired and Security alert: Refresh token reuse detected. All sessions revoked.',
      );
    }

    const newRefreshToken = this.authTokenService.generateRefreshToken();

    const isUpdated = await this.authRepository.updateSessionToken(
      authDoc.userId,
      session.sessionId,
      newRefreshToken.hash,
      newRefreshToken.expiresAt,
    );

    if (!isUpdated) {
      throw new UnauthorizedException('Failed to rotate session. Please login again.');
    }

    const user = await this.usersService.findOne(authDoc.userId.toString());

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.authTokenService.signAccessToken({
      userId: user._id.toString(),
      role: user.role,
      sessionId: session.sessionId,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: newRefreshToken.expiresAt,
      rawRefreshToken: newRefreshToken.raw,
    };
  }

  async logout(userId: Types.ObjectId, sessionId: string, accessTokenJti?: string): Promise<void> {
    await this.authSessionService.deleteSession(userId, sessionId);

    if (accessTokenJti) {
      await this.authTokenService.blacklistAccessToken(
        accessTokenJti,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );
    }
  }

  async logoutAll(userId: Types.ObjectId): Promise<void> {
    await this.authSessionService.deleteAllSessions(userId);
  }

  async setupTwoFactor(userId: Types.ObjectId): Promise<TwoFactorSetupResponseDto> {
    const result = await this.authTwoFactorService.generateTwoFactorSecret(userId);

    return new TwoFactorSetupResponseDto(result);
  }

  async enableTwoFactor(userId: Types.ObjectId, code: string) {
    return this.authTwoFactorService.enableTwoFactor(userId, code);
  }

  async disableTwoFactor(userId: Types.ObjectId, code: string): Promise<void> {
    await this.authTwoFactorService.disableTwoFactor(userId, code);
  }

  async getActiveSessions(userId: Types.ObjectId, currentSessionId: string) {
    return this.authSessionService.getActiveSessions(userId, currentSessionId);
  }

  private async findOrCreateGoogleUser(
    googleIdentity: GoogleIdentity,
  ): Promise<GoogleAuthenticatedUser> {
    let user = await this.usersService.findByEmail(googleIdentity.email);

    if (user) {
      if (!user.isEmailVerified) {
        user = await this.usersService.update(user._id.toString(), {
          isEmailVerified: true,
          avatarUrl: googleIdentity.picture,
        });
      }

      return { userId: user._id, role: user.role };
    }

    const [firstName, ...lastNameParts] = (googleIdentity.name ?? googleIdentity.email)
      .trim()
      .split(/\s+/);

    const lastName = lastNameParts.join(' ') || 'User';

    const createdUser = await this.usersService.createCustomer({
      email: googleIdentity.email,
      firstName,
      lastName,
      isEmailVerified: true,
      avatarUrl: googleIdentity.picture,
    });

    return {
      userId: createdUser._id,
      role: createdUser.role,
    };
  }

  private async issueTokensForNewSession(
    userId: Types.ObjectId,
    role: Role,
    context: SessionContext,
  ): Promise<GenerateTokensResult> {
    if (context.deviceId) {
      await this.authRepository.deleteSessionByDeviceId(userId, context.deviceId);
    }

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

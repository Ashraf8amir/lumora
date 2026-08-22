import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { CacheService } from '@/infrastructure/cache/cache.service';

import { AccessTokenPayload, MfaChallengePayload } from '../interfaces/token-payload.interface';

const ACCESS_TOKEN_BLACKLIST_PREFIX = 'auth:blacklist:access:';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  // ===========================================================================
  // Access Token
  // ===========================================================================

  signAccessToken(params: {
    userId: string;
    role: AccessTokenPayload['role'];
    sessionId: string;
  }): {
    token: string;
    jti: string;
    expiresAt: Date;
  } {
    const jti = randomUUID();

    const expiresInSeconds = this.parseExpiresIn(
      this.configService.getOrThrow<string>('jwt.access.expiration'),
    );

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const payload: AccessTokenPayload = {
      sub: params.userId,
      role: params.role,
      sessionId: params.sessionId,
      jti,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.access.secret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.access.expiration'),
      jwtid: jti,
    } as any);

    return {
      token,
      jti,
      expiresAt,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.access.secret'),
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid access token');
      }

      if (!payload.jti) {
        throw new UnauthorizedException('Invalid access token');
      }

      if (!payload.sessionId) {
        throw new UnauthorizedException('Invalid access token');
      }

      if (await this.isAccessTokenBlacklisted(payload.jti)) {
        throw new UnauthorizedException('Access token has been revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async blacklistAccessToken(jti: string, expiresAt: Date): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));

    await this.cacheService.set(`${ACCESS_TOKEN_BLACKLIST_PREFIX}${jti}`, '1', ttlSeconds);
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const value = await this.cacheService.get(`${ACCESS_TOKEN_BLACKLIST_PREFIX}${jti}`);

    return value !== null && value !== undefined;
  }

  // ===========================================================================
  // Refresh Token
  // ===========================================================================

  generateRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
    const raw = randomBytes(64).toString('base64url');

    const hash = this.hashToken(raw);

    const expiresAt = new Date(
      Date.now() +
        this.configService.getOrThrow<number>('jwt.refresh.expiration') * 24 * 60 * 60 * 1000,
    );

    return {
      raw,
      hash,
      expiresAt,
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  compareToken(rawToken: string, tokenHash: string): boolean {
    const incomingHash = Buffer.from(this.hashToken(rawToken), 'hex');
    const storedHash = Buffer.from(tokenHash, 'hex');

    if (incomingHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(incomingHash, storedHash);
  }

  // ===========================================================================
  // MFA Challenge Token
  // ===========================================================================

  signMfaChallengeToken(userId: string): { token: string; jti: string } {
    const jti = randomUUID();

    const payload: MfaChallengePayload = {
      sub: userId,
      type: 'mfa_challenge',
      jti,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.mfaChallenge.secret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.mfaChallenge.expiration'),
      jwtid: jti,
    } as any);

    return {
      token,
      jti,
    };
  }

  verifyMfaChallengeToken(token: string): MfaChallengePayload {
    try {
      const payload = this.jwtService.verify<MfaChallengePayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.mfaChallenge.secret'),
      });

      if (payload.type !== 'mfa_challenge' || !payload.sub || !payload.jti) {
        throw new UnauthorizedException('Invalid MFA challenge token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired MFA challenge token');
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private parseExpiresIn(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)\s*(s|m|h|d)$/);

    if (!match) {
      throw new Error(`Invalid JWT expiration format: ${expiresIn}`);
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;

      case 'm':
        return value * 60;

      case 'h':
        return value * 60 * 60;

      case 'd':
        return value * 24 * 60 * 60;

      default:
        throw new Error(`Unsupported JWT expiration unit: ${unit}`);
    }
  }

  // ===========================================================================
  // Helper to issue both Tokens at once
  // ===========================================================================

  async issueAuthTokens(params: {
    userId: string;
    role: AccessTokenPayload['role'];
    sessionId: string;
  }) {
    const accessToken = this.signAccessToken(params);
    const refreshToken = this.generateRefreshToken();

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshToken: refreshToken.raw,
      refreshTokenHash: refreshToken.hash,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AccessTokenPayload } from '../interfaces/token-payload.interface';
import { AuthTokenService } from '../services/auth-token.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    private readonly authTokenService: AuthTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.access.secret'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.jti && (await this.authTokenService.isAccessTokenBlacklisted(payload.jti))) {
      throw new UnauthorizedException('Access token has been revoked');
    }

    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId,
      jti: payload.jti,
    };
  }
}

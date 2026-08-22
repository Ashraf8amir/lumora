import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthTokenService } from '../services/auth-token.service';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const mfaToken = request.get('Authorization')?.replace('Bearer ', '').trim();

    if (!mfaToken) {
      throw new UnauthorizedException('MFA challenge token is missing');
    }

    const payload = this.authTokenService.verifyMfaChallengeToken(mfaToken);
    request.mfaUserId = payload.sub;

    return true;
  }
}

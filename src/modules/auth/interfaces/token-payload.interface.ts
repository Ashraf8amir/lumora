import { Role } from '@/common/enums/role.enum';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  sessionId: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface MfaChallengePayload {
  sub: string;
  type: 'mfa_challenge';
  jti: string;
  iat?: number;
  exp?: number;
}

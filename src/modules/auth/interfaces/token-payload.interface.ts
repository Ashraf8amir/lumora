import { Role } from '@/common/enums/role.enum';

import { BaseJwtPayload } from './jwt-payload.interface';

export interface AccessTokenPayload extends BaseJwtPayload {
  role: Role;
  sessionId: string;
}

export interface MfaChallengePayload extends BaseJwtPayload {
  type: 'mfa_challenge';
}

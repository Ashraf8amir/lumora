export interface GenerateTokensResult {
  requiresTwoFactor?: false;
  accessToken: string;
  accessTokenExpiresAt: Date;
  rawRefreshToken?: string;
  refreshTokenExpiresAt?: Date;
}

export interface MfaRequiredResult {
  requiresTwoFactor: true;
  mfaToken: string;
}

export type LoginResult = GenerateTokensResult | MfaRequiredResult;

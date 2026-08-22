export class AuthTokensResponseDto {
  accessToken!: string;
  accessTokenExpiresAt!: Date;
  refreshTokenExpiresAt!: Date;
  requiresTwoFactor?: boolean;
  mfaToken?: string;

  constructor(partial: Partial<AuthTokensResponseDto>) {
    Object.assign(this, partial);
  }
}

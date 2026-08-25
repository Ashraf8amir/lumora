import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiPropertyOptional({
    description: 'JWT Access Token (only present if 2FA is not required / completed)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken?: string;

  @ApiPropertyOptional({
    description: 'Expiration date of the access token',
    example: '2026-08-24T21:30:00.000Z',
  })
  accessTokenExpiresAt?: Date;

  @ApiPropertyOptional({
    description:
      'Expiration date of the refresh token (only present if 2FA is not required / completed)',
    example: '2026-08-24T21:30:00.000Z',
  })
  refreshTokenExpiresAt?: Date;

  @ApiPropertyOptional({
    description: 'True if the user must complete 2FA verification first',
    example: false,
  })
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({
    description: 'Temporary challenge token to verify 2FA code',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.challenge...',
  })
  mfaToken?: string;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}

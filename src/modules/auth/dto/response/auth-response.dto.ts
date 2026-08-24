import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class AuthResponseDto {
  @ApiPropertyOptional({
    description: 'JWT Access Token (only present if 2FA is not required / completed)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken?: string;

  @ApiPropertyOptional({
    description: 'Expiration date of the access token',
    example: '2026-08-24T21:30:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  accessTokenExpiresAt?: Date;

  @ApiPropertyOptional({
    description:
      'Expiration date of the refresh token (only present if 2FA is not required / completed)',
    example: '2026-08-24T21:30:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  refreshTokenExpiresAt?: Date;

  @ApiPropertyOptional({
    description: 'True if the user must complete 2FA verification first',
    example: false,
  })
  @Expose()
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({
    description: 'Temporary challenge token to verify 2FA code',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.challenge...',
  })
  @Expose()
  mfaToken?: string;

  @Exclude()
  rawRefreshToken?: string;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}

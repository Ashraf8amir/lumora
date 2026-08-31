import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleIdentity } from '../interfaces/google.interface';

@Injectable()
export class AuthGoogleService {
  private readonly logger = new Logger(AuthGoogleService.name);

  constructor(
    private readonly googleClient: OAuth2Client,
    private readonly configService: ConfigService,
  ) {}

  async verifyGoogleToken(idToken: string): Promise<GoogleIdentity> {
    let payload: TokenPayload | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('google.clientId'),
      });

      payload = ticket.getPayload();
    } catch (error) {
      this.logger.warn(`Google token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid, expired, or untrusted Google token');
    }

    if (!payload?.sub || !payload.email) {
      throw new BadRequestException('Invalid Google token payload');
    }

    if (!payload?.email_verified) {
      throw new BadRequestException('Google account email is not verified');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name?.trim(),
      picture: payload.picture,
    };
  }
}

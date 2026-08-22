import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Types } from 'mongoose';

import { AuthCredentialsService } from './auth-credentials.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';
import { AuthProvider } from '../enums/auth-provider.enum';
import { ActiveSession } from '../schemas/active-session.schema';
import { Role } from '@/common/enums/role.enum';

export interface GooglePayload {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class AuthGoogleService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly authCredentialsService: AuthCredentialsService,
    private readonly authSessionService: AuthSessionService,
    private readonly authTokenService: AuthTokenService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    this.googleClient = new OAuth2Client(clientId, clientSecret);
  }

  async verifyGoogleToken(idToken: string): Promise<GooglePayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
        name: payload.name,
        picture: payload.picture,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Google token');
    }
  }

  async linkGoogleAccount(userId: Types.ObjectId, idToken: string): Promise<void> {
    const googleUser = await this.verifyGoogleToken(idToken);

    if (!googleUser.emailVerified) {
      throw new BadRequestException('Google email is not verified');
    }

    await this.authCredentialsService.setProvider(userId, AuthProvider.GOOGLE, googleUser.googleId);
  }

  async loginWithGoogle(
    userId: Types.ObjectId,
    userRole: Role,
    idToken: string,
    sessionData: Omit<ActiveSession, 'sessionId' | 'createdAt' | 'isRevoked'>,
  ) {
    const googleUser = await this.verifyGoogleToken(idToken);

    if (!googleUser.emailVerified) {
      throw new BadRequestException('Google email is not verified');
    }

    await this.authCredentialsService.setProvider(userId, AuthProvider.GOOGLE, googleUser.googleId);

    const sessionId = new Types.ObjectId().toString();
    const fullSession: ActiveSession = {
      ...sessionData,
      sessionId,
      createdAt: new Date(),
      isRevoked: false,
    };

    await this.authSessionService.createSession(userId, fullSession);

    const tokens = await this.authTokenService.issueAuthTokens({
      userId: userId.toString(),
      role: userRole,
      sessionId,
    });

    return { user: googleUser, tokens };
  }
}

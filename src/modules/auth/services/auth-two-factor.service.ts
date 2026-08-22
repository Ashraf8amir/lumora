import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Types } from 'mongoose';

import { AuthRepository } from '../repositories/auth.repository';
import { AuthSecurityService } from './auth-security.service';

@Injectable()
export class AuthTwoFactorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly authSecurityService: AuthSecurityService,
  ) {
    authenticator.options = { window: 1 };
  }

  async generateTwoFactorSecret(userId: Types.ObjectId, userEmail: string) {
    const auth = await this.authRepository.findSecurityInfo(userId);
    if (!auth) {
      throw new BadRequestException('User auth details not found');
    }

    const secret = authenticator.generateSecret();
    const appName = this.configService.get<string>('APP_NAME', 'MyApp');

    const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);
    const qrCodeImageDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCodeImageDataUrl,
    };
  }

  async enableTwoFactor(userId: Types.ObjectId, secret: string, code: string) {
    const isValid = this.verifyCode(secret, code);
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code provided');
    }

    const plainBackupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = plainBackupCodes.map((code) => this.hashCode(code));

    await this.authSecurityService.enableTwoFactor(userId, secret, hashedBackupCodes);

    return {
      backupCodes: plainBackupCodes,
    };
  }

  async disableTwoFactor(userId: Types.ObjectId, code: string) {
    const auth = await this.authRepository.findSecurityInfo(userId);

    if (!auth?.security?.isTwoFactorEnabled || !auth.security.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled for this account');
    }

    const isValid = this.verifyCode(auth.security.twoFactorSecret, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.authSecurityService.disableTwoFactor(userId);
  }

  verifyCode(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  async verifyAndConsumeBackupCode(userId: Types.ObjectId, code: string): Promise<boolean> {
    const auth = await this.authRepository.findSecurityInfo(userId);

    if (!auth?.security?.isTwoFactorEnabled || !auth.security.twoFactorBackupCodes) {
      return false;
    }

    const hashCode = this.hashCode(code);
    const codeIndex = auth.security.twoFactorBackupCodes.indexOf(hashCode);

    if (codeIndex === -1) {
      return false;
    }

    const updatedBackupCodes = [...auth.security.twoFactorBackupCodes];
    updatedBackupCodes.splice(codeIndex, 1);

    await this.authRepository.updateTwoFactor(
      userId,
      true,
      auth.security.twoFactorSecret || null,
      updatedBackupCodes,
    );

    return true;
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Types } from 'mongoose';

import { AuthRepository } from '../repositories/auth.repository';
import { AuthSecurityService } from './auth-security.service';
import { UsersService } from '@/modules/users/users.service';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { CacheKeys } from '@/infrastructure/cache/cache.keys';
import { CACHE_TTL } from '@/infrastructure/cache/cache.constants';

interface PendingTwoFactorSetup {
  secret: string;
}

@Injectable()
export class AuthTwoFactorService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,

    private readonly authRepository: AuthRepository,
    private readonly authSecurityService: AuthSecurityService,
  ) {
    authenticator.options = { window: 1 };

    const encryptionKey = this.configService.get<string>('jwt.mfaChallenge.encryptionKey');

    if (!encryptionKey) {
      throw new Error('TWO_FACTOR_ENCRYPTION_KEY is not configured');
    }

    this.encryptionKey = Buffer.from(encryptionKey, 'base64');
  }

  async generateTwoFactorSecret(userId: Types.ObjectId) {
    const user = await this.usersService.findOne(userId.toString());

    const secret = authenticator.generateSecret();

    const appName = this.configService.get<string>('app.appName', 'MyApp');

    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

    const qrCodeImageDataUrl = await QRCode.toDataURL(otpauthUrl);

    const encryptedSecret = this.encryptSecret(secret);

    const cacheKey = CacheKeys.twoFactorSetup(userId.toString());

    await this.cacheService.set(
      cacheKey,
      {
        secret: encryptedSecret,
      },
      CACHE_TTL.TWO_FACTOR_SETUP,
    );

    return {
      secret,
      qrCodeImageDataUrl,
    };
  }

  async enableTwoFactor(userId: Types.ObjectId, code: string) {
    const cacheKey = CacheKeys.twoFactorSetup(userId.toString());

    const pendingSetup = await this.cacheService.get<PendingTwoFactorSetup>(cacheKey);

    if (!pendingSetup?.secret) {
      throw new BadRequestException('2FA setup has expired or was not initialized');
    }

    let secret: string;

    try {
      secret = this.decryptSecret(pendingSetup.secret);
    } catch {
      throw new BadRequestException('Invalid 2FA setup data');
    }

    const isValid = this.verifyCode(secret, code);

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code provided');
    }

    const plainBackupCodes = this.generateBackupCodes(8);

    const hashedBackupCodes = plainBackupCodes.map((backupCode) => this.hashCode(backupCode));

    await this.authSecurityService.enableTwoFactor(userId, pendingSetup.secret, hashedBackupCodes);

    await this.cacheService.del(cacheKey);

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
    const decryptedSecret = this.decryptSecret(secret);
    return authenticator.verify({ token: code, secret: decryptedSecret });
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

  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
      '.',
    );
  }

  private decryptSecret(encryptedSecret: string): string {
    const [ivBase64, authTagBase64, encryptedBase64] = encryptedSecret.split('.');

    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
      throw new Error('Invalid encrypted secret format');
    }

    const iv = Buffer.from(ivBase64, 'base64');

    const authTag = Buffer.from(authTagBase64, 'base64');

    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  }
}

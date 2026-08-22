import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class AuthSecurityService {
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000;

  constructor(private readonly authRepository: AuthRepository) {}

  async isLocked(userId: Types.ObjectId): Promise<boolean> {
    const auth = await this.authRepository.findSecurityInfo(userId);

    if (!auth) {
      throw new NotFoundException('Auth credentials not found');
    }

    const lockUntil = auth.security?.lockUntil;
    return !!(lockUntil && lockUntil > new Date());
  }

  async recordFailedLogin(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.recordFailedLogin(userId, this.LOCK_DURATION_MS);
  }

  async resetFailedLoginAttempts(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.resetFailedLoginAttempts(userId);
  }

  async incrementTokenVersion(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.incrementTokenVersion(userId);
  }

  async getTokenVersion(userId: Types.ObjectId): Promise<number> {
    const auth = await this.authRepository.findSecurityInfo(userId);

    if (!auth) {
      throw new NotFoundException('Auth credentials not found');
    }

    return auth.security?.tokenVersion ?? 0;
  }

  async enableTwoFactor(
    userId: Types.ObjectId,
    secret: string,
    backupCodes: string[],
  ): Promise<void> {
    await this.authRepository.updateTwoFactor(userId, true, secret, backupCodes);
  }

  async disableTwoFactor(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.updateTwoFactor(userId, false, null, []);
  }
}

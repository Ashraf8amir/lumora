import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthRepository } from '../repositories/auth.repository';
import { CacheKeys } from '@/infrastructure/cache/cache.keys';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { CACHE_TTL } from '@/infrastructure/cache/cache.constants';

@Injectable()
export class AuthSecurityService {
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getLockTtl(userId: Types.ObjectId | string): Promise<number> {
    const lockKey = CacheKeys.authLock(userId.toString());
    const ttl = await this.cacheService.ttl(lockKey);
    return ttl > 0 ? ttl : 0;
  }

  async isAccountLocked(userId: Types.ObjectId | string): Promise<boolean> {
    const remainingSeconds = await this.getLockTtl(userId);
    return remainingSeconds > 0;
  }

  async recordFailedLogin(userId: Types.ObjectId | string): Promise<void> {
    const attemptsKey = CacheKeys.authFailedAttempts(userId.toString());
    const lockKey = CacheKeys.authLock(userId.toString());

    const currentAttempts = (await this.cacheService.get<number>(attemptsKey)) ?? 0;
    const newAttempts = currentAttempts + 1;

    if (newAttempts >= this.MAX_ATTEMPTS) {
      await this.cacheService.set(lockKey, '1', CACHE_TTL.ACCOUNT_LOCK);
      await this.cacheService.del(attemptsKey);
      return;
    }

    await this.cacheService.set(attemptsKey, newAttempts, CACHE_TTL.FAILED_ATTEMPTS_WINDOW);
  }

  async resetFailedLoginAttempts(userId: Types.ObjectId | string): Promise<void> {
    await this.cacheService.del([
      CacheKeys.authFailedAttempts(userId.toString()),
      CacheKeys.authLock(userId.toString()),
    ]);
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

  async enableTwoFactor(userId: Types.ObjectId, secret: string, backupCodes: string[]) {
    await this.authRepository.updateTwoFactor(userId, true, secret, backupCodes);
  }

  async disableTwoFactor(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.updateTwoFactor(userId, false, null, []);
  }
}

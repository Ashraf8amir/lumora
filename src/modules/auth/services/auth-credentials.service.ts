import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthProvider } from '../enums/auth-provider.enum';

@Injectable()
export class AuthCredentialsService {
  constructor(private readonly authRepository: AuthRepository) {}

  async setPasswordHash(userId: Types.ObjectId, passwordHash: string): Promise<void> {
    await this.authRepository.setPasswordHash(userId, passwordHash);
  }

  async clearPassword(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.clearPassword(userId);
  }

  async setProvider(
    userId: Types.ObjectId,
    provider: AuthProvider,
    providerId?: string,
  ): Promise<void> {
    await this.authRepository.setProvider(userId, provider, providerId);
  }

  async updatePassword(userId: Types.ObjectId, passwordHash: string): Promise<void> {
    await this.authRepository.updatePassword(userId, passwordHash);
  }
}

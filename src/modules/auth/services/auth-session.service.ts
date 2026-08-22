import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthRepository } from '../repositories/auth.repository';
import { Auth } from '../schemas/auth.schema';
import { ActiveSession } from '../schemas/active-session.schema';

@Injectable()
export class AuthSessionService {
  constructor(private readonly authRepository: AuthRepository) {}

  async createSession(userId: Types.ObjectId, session: ActiveSession): Promise<void> {
    const isAdded = await this.authRepository.addSession(userId, session);
    if (!isAdded) {
      throw new NotFoundException('Auth credentials not found');
    }
  }

  async revokeSession(userId: Types.ObjectId, sessionId: string): Promise<boolean> {
    return this.authRepository.revokeSession(userId, sessionId);
  }

  async revokeAllSessions(userId: Types.ObjectId): Promise<boolean> {
    return this.authRepository.revokeAllSessions(userId);
  }

  async revokeSessionFamily(userId: Types.ObjectId, familyId: string): Promise<boolean> {
    return this.authRepository.revokeSessionFamily(userId, familyId);
  }

  async removeExpiredSessions(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.removeExpiredSessions(userId);
  }

  getActiveSessionsCount(auth: Auth): number {
    const now = new Date();
    return auth.sessions.filter((session) => !session.isRevoked && session.expiresAt > now).length;
  }
}

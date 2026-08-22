import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Auth, AuthDocument } from '../schemas/auth.schema';
import { ActiveSession } from '../schemas/active-session.schema';
import { AuthProvider } from '../enums/auth-provider.enum';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

  async findByUserId(userId: Types.ObjectId): Promise<AuthDocument | null> {
    return this.authModel.findOne({ userId }).select('+credentials.passwordHash');
  }

  async setPasswordHash(userId: Types.ObjectId, passwordHash: string): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.passwordHash': passwordHash,
          'security.lastPasswordChangeAt': new Date(),
        },
      },
    );
  }

  async clearPassword(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.passwordHash': null,
        },
      },
    );
  }

  async setProvider(
    userId: Types.ObjectId,
    provider: AuthProvider,
    providerId: string | null = null,
  ): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.provider': provider,
          'credentials.providerId': providerId ?? null,
        },
      },
    );
  }

  async updatePassword(userId: Types.ObjectId, passwordHash: string): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.passwordHash': passwordHash,
          'security.lastPasswordChangeAt': new Date(),
        },
        $inc: {
          'security.tokenVersion': 1,
        },
      },
    );
  }

  async findSecurityInfo(userId: Types.ObjectId): Promise<Partial<Auth> | null> {
    return this.authModel
      .findOne({ userId })
      .select('security +security.twoFactorSecret +security.twoFactorBackupCodes')
      .lean();
  }

  async recordFailedLogin(userId: Types.ObjectId, lockDurationMs: number): Promise<void> {
    const now = new Date();

    await this.authModel.updateOne(
      {
        userId,
        $or: [{ 'security.lockUntil': null }, { 'security.lockUntil': { $lte: now } }],
      },
      [
        {
          $set: {
            'security.failedLoginAttempts': {
              $add: ['$security.failedLoginAttempts', 1],
            },
            'security.lockUntil': {
              $cond: {
                if: { $gte: ['$security.failedLoginAttempts', 4] },
                then: new Date(now.getTime() + lockDurationMs),
                else: null,
              },
            },
          },
        },
      ],
    );
  }

  async resetFailedLoginAttempts(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'security.failedLoginAttempts': 0,
          'security.lockUntil': null,
        },
      },
    );
  }

  async incrementTokenVersion(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $inc: { 'security.tokenVersion': 1 },
      },
    );
  }

  async updateTwoFactor(
    userId: Types.ObjectId,
    isEnabled: boolean,
    secret: string | null,
    backupCodes: string[],
  ): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'security.isTwoFactorEnabled': isEnabled,
          'security.twoFactorBackupCodes': backupCodes,
          'security.twoFactorSecret': secret ?? null,
        },
      },
    );
  }

  async addSession(
    userId: Types.ObjectId,
    session: ActiveSession,
    maxSessions = 5,
  ): Promise<boolean> {
    const result = await this.authModel.updateOne(
      {
        userId,
        $expr: { $lt: [{ $size: '$sessions' }, maxSessions] },
      },
      { $push: { sessions: session } },
    );

    return result.matchedCount > 0;
  }

  async revokeSession(userId: Types.ObjectId, sessionId: string): Promise<boolean> {
    const result = await this.authModel.updateOne(
      {
        userId,
        'sessions.sessionId': sessionId,
        'sessions.isRevoked': false,
      },
      {
        $set: {
          'sessions.$.isRevoked': true,
          'sessions.$.revokedAt': new Date(),
        },
      },
    );

    return result.matchedCount > 0;
  }

  async revokeAllSessions(userId: Types.ObjectId): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId, 'sessions.isRevoked': false },
      {
        $set: {
          'sessions.$[session].isRevoked': true,
          'sessions.$[session].revokedAt': new Date(),
        },
        $inc: { 'security.tokenVersion': 1 },
      },
      {
        arrayFilters: [{ 'session.isRevoked': false }],
      },
    );
    return result.matchedCount > 0;
  }

  async revokeSessionFamily(userId: Types.ObjectId, familyId: string): Promise<boolean> {
    const result = await this.authModel.updateOne(
      {
        userId,
        'sessions.familyId': familyId,
        'sessions.isRevoked': false,
      },
      {
        $set: {
          'sessions.$[session].isRevoked': true,
          'sessions.$[session].revokedAt': new Date(),
        },
      },
      {
        arrayFilters: [
          {
            'session.familyId': familyId,
            'session.isRevoked': false,
          },
        ],
      },
    );

    return result.matchedCount > 0;
  }

  async removeExpiredSessions(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { expiresAt: { $lte: new Date() } },
        },
      },
    );
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthDocument | null> {
    const now = new Date();

    return this.authModel
      .findOne({
        sessions: {
          $elemMatch: {
            refreshTokenHash,
            isRevoked: false,
            expiresAt: { $gt: now },
          },
        },
      })
      .select('+sessions.refreshTokenHash');
  }
}

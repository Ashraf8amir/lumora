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
      { upsert: true, setDefaultsOnInsert: true },
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
      { upsert: true, setDefaultsOnInsert: true },
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
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  async findSecurityInfo(userId: Types.ObjectId): Promise<Partial<Auth> | null> {
    return this.authModel
      .findOne({ userId })
      .select('+security.twoFactorSecret +security.twoFactorBackupCodes')
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
      { updatePipeline: true },
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

  async updateSessionToken(
    userId: Types.ObjectId,
    sessionId: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ): Promise<boolean> {
    const result = await this.authModel.updateOne(
      {
        userId,
        'sessions.sessionId': sessionId,
      },
      {
        $set: {
          'sessions.$.refreshTokenHash': newRefreshTokenHash,
          'sessions.$.expiresAt': newExpiresAt,
          'sessions.$.updatedAt': new Date(),
        },
      },
    );

    return result.matchedCount > 0;
  }

  async deleteSession(userId: Types.ObjectId, sessionId: string): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { sessionId },
        },
      },
    );

    return result.modifiedCount > 0;
  }

  async deleteSessionByDeviceId(userId: Types.ObjectId, deviceId: string): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { deviceId },
        },
      },
    );
  }

  async deleteAllSessions(userId: Types.ObjectId): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $set: { sessions: [] },
        $inc: { 'security.tokenVersion': 1 },
      },
    );

    return result.modifiedCount > 0;
  }

  async deleteSessionFamily(userId: Types.ObjectId, familyId: string): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { familyId },
        },
      },
    );

    return result.modifiedCount > 0;
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
            expiresAt: { $gt: now },
          },
        },
      })
      .select('+sessions.refreshTokenHash');
  }
}

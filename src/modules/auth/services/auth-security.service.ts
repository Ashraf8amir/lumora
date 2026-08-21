import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Auth, AuthDocument } from '../schemas/auth.schema';

@Injectable()
export class AuthSecurityService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000;

  constructor(
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

  async isLocked(userId: Types.ObjectId): Promise<boolean> {
    const auth = await this.authModel.findOne({ userId }).select('security.lockUntil').lean();

    if (!auth) {
      throw new NotFoundException('Auth credentials not found');
    }

    const lockUntil = auth.security?.lockUntil;

    return !!(lockUntil && lockUntil > new Date());
  }

  async recordFailedLogin(userId: Types.ObjectId): Promise<void> {
    const now = new Date();

    await this.authModel.updateOne(
      {
        userId,
        $or: [
          {
            'security.lockUntil': null,
          },
          {
            'security.lockUntil': { $lte: now },
          },
        ],
      },
      {
        $inc: {
          'security.failedLoginAttempts': 1,
        },
        $set: {
          'security.lockUntil': null,
        },
      },
    );

    await this.authModel.updateOne(
      {
        userId,
        'security.failedLoginAttempts': {
          $gte: this.MAX_LOGIN_ATTEMPTS,
        },
        $or: [
          {
            'security.lockUntil': null,
          },
          {
            'security.lockUntil': { $lte: now },
          },
        ],
      },
      {
        $set: {
          'security.lockUntil': new Date(now.getTime() + this.LOCK_DURATION_MS),
        },
      },
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
        $inc: {
          'security.tokenVersion': 1,
        },
      },
    );
  }

  async getTokenVersion(userId: Types.ObjectId): Promise<number> {
    const auth = await this.authModel.findOne({ userId }).select('security.tokenVersion').lean();

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
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'security.isTwoFactorEnabled': true,
          'security.twoFactorSecret': secret,
          'security.twoFactorBackupCodes': backupCodes,
        },
      },
    );
  }

  async disableTwoFactor(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'security.isTwoFactorEnabled': false,
          'security.twoFactorSecret': null,
          'security.twoFactorBackupCodes': [],
        },
      },
    );
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Auth, AuthDocument } from '../schemas/auth.schema';
import { ActiveSession } from '../schemas/active-session.schema';

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

  async createSession(userId: Types.ObjectId, session: ActiveSession): Promise<void> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $push: {
          sessions: session,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Auth credentials not found');
    }
  }

  async revokeSession(userId: Types.ObjectId, sessionId: string): Promise<boolean> {
    const now = new Date();

    const result = await this.authModel.updateOne(
      {
        userId,
        sessions: {
          $elemMatch: {
            sessionId,
            isRevoked: false,
          },
        },
      },
      {
        $set: {
          'sessions.$.isRevoked': true,
          'sessions.$.revokedAt': now,
        },
      },
    );

    return result.modifiedCount > 0;
  }

  async revokeAllSessions(userId: Types.ObjectId): Promise<boolean> {
    const now = new Date();

    const result = await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'sessions.$[session].isRevoked': true,
          'sessions.$[session].revokedAt': now,
        },
        $inc: {
          'security.tokenVersion': 1,
        },
      },
      {
        arrayFilters: [
          {
            'session.isRevoked': false,
          },
        ],
      },
    );

    return result.modifiedCount > 0;
  }

  async revokeSessionFamily(userId: Types.ObjectId, familyId: string): Promise<boolean> {
    const now = new Date();

    const result = await this.authModel.updateOne(
      {
        userId,
        sessions: {
          $elemMatch: {
            familyId,
            isRevoked: false,
          },
        },
      },
      {
        $set: {
          'sessions.$[session].isRevoked': true,
          'sessions.$[session].revokedAt': now,
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

    return result.modifiedCount > 0;
  }

  async removeExpiredSessions(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: {
            expiresAt: {
              $lte: new Date(),
            },
          },
        },
      },
    );
  }

  getActiveSessionsCount(auth: Auth): number {
    const now = new Date();

    return auth.sessions.filter((session) => !session.isRevoked && session.expiresAt > now).length;
  }
}

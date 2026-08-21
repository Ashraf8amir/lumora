import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Auth, AuthDocument } from '../schemas/auth.schema';
import { AuthProvider } from '../enums/auth-provider.enum';

@Injectable()
export class AuthCredentialsService {
  constructor(
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

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
    providerId?: string,
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
}

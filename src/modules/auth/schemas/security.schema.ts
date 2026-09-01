import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { SecurityToken, SecurityTokenSchema } from './security-token.schema';

@Schema({ _id: false })
export class AuthSecurity {
  @Prop({ type: Number, default: 0 })
  tokenVersion!: number;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date })
  lockUntil?: Date;

  @Prop({ type: SecurityTokenSchema, required: false })
  passwordReset?: SecurityToken;

  @Prop({ type: SecurityTokenSchema, required: false })
  emailVerification?: SecurityToken;

  @Prop({ type: Boolean, default: false })
  isTwoFactorEnabled!: boolean;

  @Prop({ type: String, select: false })
  twoFactorSecret?: string | null;

  @Prop({ type: [String], select: false, default: undefined })
  twoFactorBackupCodes?: string[];

  @Prop({ type: Date, default: null })
  lastPasswordChangeAt?: Date | null;
}

export const AuthSecuritySchema = SchemaFactory.createForClass(AuthSecurity);

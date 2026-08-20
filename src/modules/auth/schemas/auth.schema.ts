import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { AuthProvider } from '../enums/auth-provider.enum';

export type AuthDocument = HydratedDocument<Auth>;

@Schema({ _id: false })
export class ActiveSession {
  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ required: true, select: false })
  refreshTokenHash!: string;

  @Prop({ required: true, index: true })
  familyId!: string;

  @Prop({ required: true })
  deviceId!: string;

  @Prop({ trim: true })
  deviceName?: string;

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ type: String, default: null })
  userAgent?: string | null;

  @Prop({ default: 'Unknown' })
  browser!: string;

  @Prop({ default: 'Unknown' })
  os!: string;

  @Prop({ default: 'Unknown' })
  deviceType!: string;

  @Prop({ default: false })
  isPrimary!: boolean;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: false })
  isRevoked!: boolean;

  @Prop({ type: Date, default: null })
  revokedAt?: Date;
}

export const ActiveSessionSchema = SchemaFactory.createForClass(ActiveSession);

@Schema({ _id: false })
export class SecurityToken {
  @Prop({ type: String, select: false, default: null })
  tokenHash?: string;

  @Prop({ type: Date, default: null })
  expiresAt?: Date;
}

export const SecurityTokenSchema = SchemaFactory.createForClass(SecurityToken);

@Schema({
  timestamps: true,
  collection: 'auth_credentials',
  versionKey: false,
})
export class Auth {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.LOCAL, index: true })
  provider!: AuthProvider;

  @Prop({ type: String, default: null, index: true })
  providerId?: string;

  @Prop({ type: String, select: false, default: null })
  passwordHash?: string;

  @Prop({ type: [ActiveSessionSchema], default: [] })
  activeSessions!: ActiveSession[];

  @Prop({ type: Number, default: 0 })
  tokenVersion!: number;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date, default: null })
  lockUntil?: Date;

  @Prop({ type: SecurityTokenSchema, default: () => ({}) })
  passwordReset?: SecurityToken;

  @Prop({ type: SecurityTokenSchema, default: () => ({}) })
  emailVerification?: SecurityToken;

  @Prop({ default: false })
  isTwoFactorEnabled!: boolean;

  @Prop({ type: String, select: false, default: null })
  twoFactorSecret?: string;

  @Prop({ type: [String], select: false, default: [] })
  twoFactorBackupCodes?: string[];

  @Prop({ type: Date, default: null })
  lastPasswordChangeAt?: Date;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);

AuthSchema.index(
  { provider: 1, providerId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { providerId: { $ne: null } } },
);

AuthSchema.index({ 'activeSessions.sessionId': 1 });

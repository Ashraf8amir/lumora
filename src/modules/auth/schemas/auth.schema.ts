import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { AuthCredentialsSchema, AuthCredentials } from './auth-credentials.schema';
import { ActiveSessionSchema, ActiveSession } from './active-session.schema';
import { AuthSecuritySchema, AuthSecurity } from './security.schema';

export type AuthDocument = HydratedDocument<Auth>;

@Schema({
  timestamps: true,
  collection: 'auth_credentials',
  versionKey: false,
})
export class Auth {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: AuthCredentialsSchema, required: true, default: () => ({}) })
  credentials!: AuthCredentials;

  @Prop({ type: [ActiveSessionSchema], default: [] })
  sessions!: ActiveSession[];

  @Prop({ type: AuthSecuritySchema, required: true, default: () => ({}) })
  security!: AuthSecurity;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);

AuthSchema.index(
  {
    'credentials.provider': 1,
    'credentials.providerId': 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      'credentials.providerId': {
        $ne: null,
      },
    },
  },
);

AuthSchema.index({ 'sessions.sessionId': 1 });

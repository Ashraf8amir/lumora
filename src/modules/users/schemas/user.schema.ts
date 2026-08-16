import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Role } from '@/common/enums/role.enum';
import { softDeletePlugin } from '@/infrastructure/providers/mongoose/plugins/soft-delete.plugin';

export interface UserMethods {
  emailVerification(): Promise<UserDocument>;
  activate(): Promise<UserDocument>;
  deactivate(): Promise<UserDocument>;
  changeAvatar(url: string): Promise<UserDocument>;
  softDelete(): Promise<UserDocument>;
}

export type UserDocument = User & Document & UserMethods;

@Schema({
  timestamps: true,
  discriminatorKey: 'role',
  collection: 'users',
  versionKey: false,

  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      delete ret.isDeleted;
      delete ret.deletedAt;
      return ret;
    },
  },
})
export class User {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  firstName!: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  lastName!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  })
  email!: string;

  @Prop({ type: String, enum: Role, required: true, default: Role.CUSTOMER })
  role!: Role;

  @Prop({ trim: true, match: [/^01[0-2,5]{1}[0-9]{8}$/, 'Invalid phone format'] })
  phone?: string;

  @Prop({
    type: Date,
    validate: {
      validator: function (value: Date) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past',
    },
  })
  dateOfBirth?: Date;

  @Prop({
    trim: true,
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: '{VALUE} is an invalid gender format',
    },
    default: 'Other',
  })
  gender?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: null })
  avatarUrl?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(softDeletePlugin);

UserSchema.index({ role: 1, isActive: 1 });

UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

UserSchema.virtual('initials').get(function (this: UserDocument) {
  if (!this.firstName || !this.lastName) return '';
  return `${this.firstName.charAt(0).toUpperCase()}${this.lastName.charAt(0).toUpperCase()}`;
});

UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('age').get(function (this: UserDocument) {
  if (!this.dateOfBirth) return null;
  const ageDifMs = Date.now() - this.dateOfBirth.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

UserSchema.methods.activate = async function (this: UserDocument) {
  this.isActive = true;
  return this.save();
};

UserSchema.methods.deactivate = async function (this: UserDocument) {
  this.isActive = false;
  return this.save();
};

UserSchema.methods.emailVerification = async function (this: UserDocument) {
  this.isEmailVerified = true;
  return this.save();
};

UserSchema.methods.changeAvatar = async function (this: UserDocument, url: string) {
  this.avatarUrl = url;
  return this.save();
};

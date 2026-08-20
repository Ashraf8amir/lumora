import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Role } from '@/common/enums/role.enum';
import {
  SoftDeleteFields,
  softDeletePlugin,
} from '@/infrastructure/providers/mongoose/plugins/soft-delete.plugin';
import { Gender } from '../enums/gender.enum';
import { UserMethods } from '../interfaces/user-methods.interface';

export type UserDocument = HydratedDocument<User & SoftDeleteFields, UserMethods<User>>;

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret._id;
  delete ret.isDeleted;
  delete ret.deletedAt;
  delete ret.createdAt;
  delete ret.updatedAt;

  return ret;
};

@Schema({
  timestamps: true,
  discriminatorKey: 'role',
  collection: 'users',
  versionKey: false,

  toJSON: {
    virtuals: true,
    transform,
  },

  toObject: {
    virtuals: true,
    transform,
  },
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  firstName!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  lastName!: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    maxLength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  })
  email!: string;

  @Prop({
    type: String,
    enum: Role,
    required: true,
    default: Role.CUSTOMER,
  })
  role!: Role;

  @Prop({
    trim: true,
    match: [/^01[0125][0-9]{8}$/, 'Invalid phone format'],
  })
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
    type: String,
    trim: true,
    enum: Object.values(Gender),
    default: Gender.OTHER,
  })
  gender?: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: false, index: true })
  isEmailVerified!: boolean;

  @Prop({ default: null })
  avatarUrl?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.plugin(softDeletePlugin);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $exists: true },
      isDeleted: false,
    },
  },
);

UserSchema.index({
  role: 1,
  isActive: 1,
});

UserSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
});

UserSchema.virtual('initials').get(function (this: UserDocument) {
  if (!this.firstName || !this.lastName) return '';

  return `${this.firstName.charAt(0).toUpperCase()}${this.lastName.charAt(0).toUpperCase()}`;
});

UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('age').get(function (this: UserDocument) {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birthDate = this.dateOfBirth;

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

UserSchema.methods.activate = async function (this: UserDocument) {
  if (!this.isActive) {
    this.isActive = true;
    await this.save();
  }

  return this;
};

UserSchema.methods.deactivate = async function (this: UserDocument) {
  if (this.isActive) {
    this.isActive = false;
    await this.save();
  }

  return this;
};

UserSchema.methods.verifyEmail = async function (this: UserDocument) {
  if (!this.isEmailVerified) {
    this.isEmailVerified = true;
    await this.save();
  }

  return this;
};

UserSchema.methods.changeAvatar = async function (this: UserDocument, url: string) {
  this.avatarUrl = url.trim();
  await this.save();
  return this;
};

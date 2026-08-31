import { Types } from 'mongoose';
import { Role } from '@/common/enums/role.enum';

export interface GoogleIdentity {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleAuthenticatedUser {
  userId: Types.ObjectId;
  role: Role;
}

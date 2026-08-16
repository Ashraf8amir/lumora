import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AccessLevel } from '../../enums/access-level.enum';
import { User } from '../user.schema';

export interface AdminMethods {
  restrictAccess(): Promise<AdminDocument>;
  grantFullAccess(): Promise<AdminDocument>;
}

export type AdminDocument = Admin & User & Document & AdminMethods;

@Schema()
export class Admin {
  @Prop({ type: String, enum: AccessLevel, default: AccessLevel.LIMITED })
  accessLevel!: AccessLevel;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.methods.restrictAccess = async function (this: AdminDocument) {
  this.accessLevel = AccessLevel.LIMITED;
  return this.save();
};

AdminSchema.methods.grantFullAccess = async function (this: AdminDocument) {
  this.accessLevel = AccessLevel.FULL;
  return this.save();
};

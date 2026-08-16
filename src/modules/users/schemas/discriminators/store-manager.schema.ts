import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user.schema';

export interface StoreManagerMethods {
  hasPermission(permission: string): boolean;
  grantPermission(permission: string): Promise<StoreManagerDocument>;
  revokePermission(permission: string): Promise<StoreManagerDocument>;
}

export type StoreManagerDocument = StoreManager & User & Document & StoreManagerMethods;

@Schema()
export class StoreManager {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  managedStoreId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions!: string[];
}

export const StoreManagerSchema = SchemaFactory.createForClass(StoreManager);

StoreManagerSchema.methods.hasPermission = function (
  this: StoreManagerDocument,
  permission: string,
) {
  return this.permissions.includes(permission);
};

StoreManagerSchema.methods.grantPermission = async function (
  this: StoreManagerDocument,
  permission: string,
) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
    await this.save();
  }
  return this;
};

StoreManagerSchema.methods.revokePermission = async function (
  this: StoreManagerDocument,
  permission: string,
) {
  this.permissions = this.permissions.filter((p) => p !== permission);
  return this.save();
};

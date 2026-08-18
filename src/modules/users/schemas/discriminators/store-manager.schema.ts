import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { StoreManagerMethods } from '../../interfaces/store-manger-methods.interface';

export type StoreManagerDocument = HydratedDocument<
  StoreManager,
  StoreManagerMethods<StoreManager>
>;

@Schema()
export class StoreManager {
  @Prop({ default: true, index: true })
  isManagementEnabled!: boolean;

  @Prop({ type: Date, default: null })
  lastManagementActivityAt?: Date;
}

export const StoreManagerSchema = SchemaFactory.createForClass(StoreManager);

StoreManagerSchema.methods.enableManagement = async function (this: StoreManagerDocument) {
  if (!this.isManagementEnabled) {
    this.isManagementEnabled = true;
    await this.save();
  }

  return this;
};

StoreManagerSchema.methods.disableManagement = async function (this: StoreManagerDocument) {
  if (this.isManagementEnabled) {
    this.isManagementEnabled = false;
    await this.save();
  }

  return this;
};

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Point, PointSchema } from '@/common/schemas/point.schema';
import { User } from '../user.schema';
import { CustomerStatus } from '../../enums/customer-status.enum';
import { CustomerTier } from '../../enums/customer-tier.enum';

export type CustomerDocument = HydratedDocument<Customer & User>;

@Schema()
export class Address {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  city!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  street!: string;

  @Prop({ required: true, trim: true, maxlength: 20 })
  building!: string;

  @Prop({ required: true, trim: true, maxlength: 20 })
  apartment!: string;

  @Prop({ trim: true, maxlength: 20 })
  floor?: string;

  @Prop({ type: PointSchema })
  location?: Point;

  @Prop({ trim: true, maxlength: 500 })
  note?: string;

  @Prop({ default: false })
  isDefault!: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema()
export class Customer {
  @Prop({
    type: String,
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status!: string;

  @Prop({
    type: String,
    enum: CustomerTier,
    default: CustomerTier.BRONZE,
  })
  tier!: string;

  @Prop({ type: Number, min: 0, default: 0 })
  totalSpent!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  loyaltyPoints!: number;

  @Prop({ type: [AddressSchema], default: [] })
  addresses!: Address[];

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  wishlist!: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  lastOrderAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ lastOrderAt: -1 });
CustomerSchema.index({ 'addresses.location': '2dsphere' });

CustomerSchema.virtual('defaultAddress').get(function (this: CustomerDocument) {
  return this.addresses.find((address) => address.isDefault) ?? null;
});

CustomerSchema.virtual('wishlistCount').get(function (this: CustomerDocument) {
  return this.wishlist.length;
});

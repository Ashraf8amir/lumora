import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user.schema';

export interface CustomerMethods {
  addLoyaltyPoints(points: number): Promise<CustomerDocument>;
  redeemLoyaltyPoints(points: number): Promise<CustomerDocument>;
  setDefaultAddress(index: number): Promise<CustomerDocument>;
  addToWishlist(productId: Types.ObjectId): Promise<CustomerDocument>;
  removeFromWishlist(productId: Types.ObjectId): Promise<CustomerDocument>;
}

export type CustomerDocument = Customer & User & Document & CustomerMethods;

@Schema({ _id: true })
export class Address {
  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ required: true, trim: true })
  building!: string;

  @Prop({ required: true, trim: true })
  apartment!: string;

  @Prop({ trim: true })
  floor?: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ default: false })
  isDefault!: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema()
export class Customer {
  @Prop({ default: 0, min: 0 })
  loyaltyPoints!: number;

  @Prop({ type: [AddressSchema], default: [] })
  addresses!: Address[];

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  wishlist!: Types.ObjectId[];
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.virtual('defaultAddress').get(function (this: CustomerDocument) {
  return this.addresses.find((address) => address.isDefault) ?? null;
});

CustomerSchema.methods.addLoyaltyPoints = function (this: CustomerDocument, points: number) {
  return this.updateOne({ $inc: { loyaltyPoints: points } });
};

CustomerSchema.methods.redeemLoyaltyPoints = async function (
  this: CustomerDocument,
  points: number,
) {
  if (points > this.loyaltyPoints) {
    throw new Error('Insufficient loyalty points');
  }
  this.loyaltyPoints -= points;
  return this.save();
};

CustomerSchema.methods.setDefaultAddress = async function (this: CustomerDocument, index: number) {
  this.addresses.forEach((address, i) => {
    address.isDefault = i === index;
  });
  return this.save();
};

CustomerSchema.methods.addToWishlist = function (
  this: CustomerDocument,
  productId: Types.ObjectId,
) {
  return this.updateOne({ $addToSet: { wishlist: productId } });
};

CustomerSchema.methods.removeFromWishlist = function (
  this: CustomerDocument,
  productId: Types.ObjectId,
) {
  return this.updateOne({ $pull: { wishlist: productId } });
};

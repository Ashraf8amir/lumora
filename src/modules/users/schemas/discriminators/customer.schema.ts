import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CustomerMethods } from '../../interfaces/customer-methods.interface';
import { CustomerStatus } from '../../enums/customer-status.enum';
import { CustomerTier } from '../../enums/customer-tier.enum';

export type CustomerDocument = HydratedDocument<Customer, CustomerMethods<Customer, Address>>;

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

  @Prop({
    type: { type: String, enum: ['Point'] },
    coordinates: {
      type: [Number],
      validate: {
        validator: (value: number[]) => {
          if (value.length !== 2) return false;

          const [longitude, latitude] = value;

          return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
        },
        message: 'Location coordinates must be [longitude, latitude] with valid ranges',
      },
    },
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

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

CustomerSchema.methods.addLoyaltyPoints = async function (this: CustomerDocument, points: number) {
  if (!Number.isInteger(points) || points <= 0)
    throw new Error('Loyalty points must be a positive integer');

  this.loyaltyPoints += points;

  await this.save();

  return this;
};

CustomerSchema.methods.redeemLoyaltyPoints = async function (
  this: CustomerDocument,
  points: number,
) {
  if (!Number.isInteger(points) || points <= 0)
    throw new Error('Loyalty points must be a positive integer');

  if (points > this.loyaltyPoints) throw new Error('Insufficient loyalty points');

  this.loyaltyPoints -= points;

  await this.save();

  return this;
};

CustomerSchema.methods.addAddress = async function (this: CustomerDocument, address: Address) {
  if (this.addresses.length === 0) address.isDefault = true;

  this.addresses.push(address);

  await this.save();

  return this;
};

CustomerSchema.methods.setDefaultAddress = async function (
  this: CustomerDocument,
  addressId: Types.ObjectId,
) {
  const address = this.addresses.find((address) => address._id.equals(addressId));

  if (!address) throw new Error('Address not found');

  this.addresses.forEach((item) => {
    item.isDefault = false;
  });

  address.isDefault = true;

  await this.save();

  return this;
};

CustomerSchema.methods.removeAddress = async function (
  this: CustomerDocument,
  addressId: Types.ObjectId,
) {
  const address = this.addresses.find((address) => address._id.equals(addressId));

  if (!address) throw new Error('Address not found');

  const wasDefault = address.isDefault;

  this.addresses = this.addresses.filter((item) => !item._id.equals(addressId));

  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }

  await this.save();

  return this;
};

CustomerSchema.methods.addToWishlist = async function (
  this: CustomerDocument,
  productId: Types.ObjectId,
) {
  if (!this.wishlist.some((id) => id.equals(productId))) {
    this.wishlist.push(productId);

    await this.save();
  }

  return this;
};

CustomerSchema.methods.removeFromWishlist = async function (
  this: CustomerDocument,
  productId: Types.ObjectId,
) {
  this.wishlist = this.wishlist.filter((id) => !id.equals(productId));

  await this.save();

  return this;
};

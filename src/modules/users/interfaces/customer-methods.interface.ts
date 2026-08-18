import { Types } from 'mongoose';

export interface CustomerMethods<T, Address> {
  addLoyaltyPoints(points: number): Promise<T>;
  redeemLoyaltyPoints(points: number): Promise<T>;

  setDefaultAddress(addressId: Types.ObjectId): Promise<T>;
  addAddress(address: Address): Promise<T>;
  removeAddress(addressId: Types.ObjectId): Promise<T>;

  addToWishlist(productId: Types.ObjectId): Promise<T>;
  removeFromWishlist(productId: Types.ObjectId): Promise<T>;
}

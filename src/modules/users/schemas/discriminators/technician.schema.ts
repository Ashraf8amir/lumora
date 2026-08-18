import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Point, PointSchema } from '@/common/schemas/point.schema';
import { User } from '../user.schema';
import { TechnicianMethods } from '../../interfaces/technician-methods.interface';
import { TechnicianStatus } from '../../enums/technician-status.enum';

export type TechnicianDocument = HydratedDocument<Technician & User, TechnicianMethods<Technician>>;

@Schema({ _id: false })
export class TechnicianProfile {
  @Prop({ type: [String], default: [], trim: true })
  skills!: string[];

  @Prop({ type: [String], default: [], trim: true })
  certifications!: string[];

  @Prop({ type: Number, min: 0, default: 0 })
  yearsOfExperience!: number;

  @Prop({ type: String, trim: true, maxlength: 1000 })
  bio?: string;
}

@Schema({ _id: false })
export class TechnicianStats {
  @Prop({ type: Number, min: 0, default: 0 })
  completedTickets!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  cancelledTickets!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  averageRating!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  totalRatings!: number;
}

@Schema()
export class Technician {
  @Prop({ type: TechnicianProfile, default: () => ({}) })
  profile!: TechnicianProfile;

  @Prop({ default: true, index: true })
  isAvailable!: boolean;

  @Prop({ type: Date, default: null })
  lastAvailableAt?: Date;

  @Prop({ type: Date, default: null })
  lastAssignedAt?: Date;

  @Prop({
    type: String,
    enum: TechnicianStatus,
    default: TechnicianStatus.OFFLINE,
    index: true,
  })
  status!: string;

  @Prop({ type: TechnicianStats, default: () => ({}) })
  stats!: TechnicianStats;

  @Prop({ type: PointSchema })
  location?: Point;

  @Prop({ type: Date, default: null })
  lastLocationUpdatedAt?: Date;
}
export const TechnicianSchema = SchemaFactory.createForClass(Technician);

TechnicianSchema.index({ location: '2dsphere' });

TechnicianSchema.virtual('ratingLabel').get(function (this: TechnicianDocument) {
  if (this.stats.averageRating >= 4.5) return 'Excellent';

  if (this.stats.averageRating >= 4) return 'Very Good';

  if (this.stats.averageRating >= 3) return 'Good';

  return 'Needs Improvement';
});

TechnicianSchema.methods.setAvailability = async function (
  this: TechnicianDocument,
  available: boolean,
) {
  if (this.isAvailable === available) return this;

  this.isAvailable = available;

  if (available) this.lastAvailableAt = new Date();

  await this.save();

  return this;
};

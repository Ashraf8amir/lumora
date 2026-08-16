import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user.schema';

export interface TechnicianMethods {
  assignTicket(ticketId: Types.ObjectId): Promise<TechnicianDocument>;
  completeTicket(ticketId: Types.ObjectId): Promise<TechnicianDocument>;
  markUnavailable(): Promise<TechnicianDocument>;
  markAvailable(): Promise<TechnicianDocument>;
}

export type TechnicianDocument = Technician & User & Document & TechnicianMethods;

@Schema()
export class Technician {
  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'ServiceTicket', default: [] })
  assignedTickets!: Types.ObjectId[];
}

export const TechnicianSchema = SchemaFactory.createForClass(Technician);

TechnicianSchema.virtual('activeTicketsCount').get(function (this: TechnicianDocument) {
  return this.assignedTickets.length;
});

TechnicianSchema.methods.assignTicket = async function (
  this: TechnicianDocument,
  ticketId: Types.ObjectId,
) {
  this.assignedTickets.push(ticketId);
  return this.save();
};

TechnicianSchema.methods.completeTicket = async function (
  this: TechnicianDocument,
  ticketId: Types.ObjectId,
) {
  this.assignedTickets = this.assignedTickets.filter((id) => !id.equals(ticketId));
  return this.save();
};

TechnicianSchema.methods.markUnavailable = async function (this: TechnicianDocument) {
  this.isAvailable = false;
  return this.save();
};

TechnicianSchema.methods.markAvailable = async function (this: TechnicianDocument) {
  this.isAvailable = true;
  return this.save();
};

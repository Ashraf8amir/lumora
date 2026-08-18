import { Types } from 'mongoose';

export interface TechnicianMethods<T> {
  assignTicket(ticketId: Types.ObjectId): Promise<T>;
  completeTicket(ticketId: Types.ObjectId): Promise<T>;
  markUnavailable(): Promise<T>;
  markAvailable(): Promise<T>;
}

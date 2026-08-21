import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SecurityToken {
  @Prop({ type: String, select: false, default: null })
  tokenHash?: string | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;
}

export const SecurityTokenSchema = SchemaFactory.createForClass(SecurityToken);

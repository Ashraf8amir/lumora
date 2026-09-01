import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SecurityToken {
  @Prop({ type: String, required: true, select: false })
  tokenHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;
}

export const SecurityTokenSchema = SchemaFactory.createForClass(SecurityToken);

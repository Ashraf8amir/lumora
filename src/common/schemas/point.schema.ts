import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Point {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type!: 'Point';

  @Prop({
    type: [Number],
    validate: {
      validator: (value: number[]) => {
        if (value.length !== 2) return false;

        const [longitude, latitude] = value;

        return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges',
    },
  })
  coordinates!: [number, number];
}

export const PointSchema = SchemaFactory.createForClass(Point);

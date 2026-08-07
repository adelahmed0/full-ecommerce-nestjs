import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true })
export class Brand {
  @Prop({
    required: true,
    type: String,
    trim: true,
    unique: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [100, 'Name must be at most 100 characters long'],
  })
  name: string;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  image?: string | null;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

function sanitizeBrand(
  _doc: unknown,
  ret: {
    _id?: unknown;
    id?: string;
  },
) {
  ret.id = String(ret._id);
  delete ret._id;
  return ret;
}

BrandSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeBrand,
});

BrandSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeBrand,
});

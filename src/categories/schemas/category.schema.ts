import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({
    required: true,
    type: String,
    trim: true,
    unique: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [30, 'Name must be at most 30 characters long'],
  })
  name: string;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  image?: string | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

function sanitizeCategory(
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

CategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeCategory,
});

CategorySchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeCategory,
});

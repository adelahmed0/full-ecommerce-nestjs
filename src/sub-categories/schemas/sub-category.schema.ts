import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';

export type SubCategoryDocument = HydratedDocument<SubCategory>;

@Schema({ timestamps: true })
export class SubCategory {
  @Prop({
    required: true,
    type: String,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [20, 'Name must be at most 20 characters long'],
  })
  name: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: Category.name,
  })
  category: Types.ObjectId;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

SubCategorySchema.index({ name: 1, category: 1 }, { unique: true });

function sanitizeSubCategory(
  _doc: unknown,
  ret: {
    _id?: unknown;
    id?: string;
    category?: unknown;
  },
) {
  ret.id = String(ret._id);
  delete ret._id;

  if (ret.category && typeof ret.category === 'object') {
    const category = ret.category as {
      _id?: { toString(): string };
      id?: string;
    };
    ret.category = category.id ?? category._id?.toString() ?? ret.category;
  } else if (ret.category != null) {
    ret.category = String(ret.category);
  }

  return ret;
}

SubCategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeSubCategory,
});

SubCategorySchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeSubCategory,
});

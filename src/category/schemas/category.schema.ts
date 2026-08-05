import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyDocumentJsonTransform } from '../../common/utils/mongoose-document.util';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({
    required: true,
    type: String,
    trim: true,
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

applyDocumentJsonTransform(CategorySchema);

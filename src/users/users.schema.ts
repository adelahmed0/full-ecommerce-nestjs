import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class Cat {
  @Prop()
  name: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);

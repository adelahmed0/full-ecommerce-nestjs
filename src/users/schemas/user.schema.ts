import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, UserActive, UserGender } from '../enums/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    type: String,
    min: [3, 'Name must be at least 3 characters long'],
    max: [30, 'Name must be less than 30 characters long'],
  })
  name: string;

  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  email: string;

  @Prop({
    required: true,
    type: String,
    min: [3, 'Password must be at least 8 characters long'],
    max: [20, 'Password must be less than 20 characters long'],
  })
  password: string;

  @Prop({
    required: true,
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({
    type: String,
    default: null,
  })
  avatar: string | null;

  @Prop({
    type: Number,
  })
  age: number;

  @Prop({
    type: String,
  })
  phoneNumber: string;

  @Prop({
    type: String,
  })
  address: string;

  @Prop({
    type: Boolean,
    default: UserActive.ACTIVE,
  })
  active: UserActive;

  @Prop({
    type: String,
    default: null,
  })
  verificationCode: string | null;

  @Prop({
    type: String,
    enum: UserGender,
  })
  gender: UserGender;
}

export const UserSchema = SchemaFactory.createForClass(User);

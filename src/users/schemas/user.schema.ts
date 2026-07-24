import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, UserActive, UserGender } from '../enums/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    type: String,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [30, 'Name must be at most 30 characters long'],
  })
  name: string;

  @Prop({
    required: true,
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    type: String,
    minlength: [3, 'Password must be at least 3 characters long'],
    maxlength: [20, 'Password must be at most 20 characters long'],
    select: false,
  })
  password: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  avatar?: string | null;

  @Prop({
    type: Number,
    required: false,
    min: [1, 'Age must be at least 1'],
  })
  age?: number;

  @Prop({
    type: String,
    required: false,
    match: [
      /^01[0125][0-9]{8}$/,
      'phoneNumber must be a valid Egyptian mobile number (11 digits)',
    ],
  })
  phoneNumber?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  address?: string;

  @Prop({
    type: Boolean,
    default: UserActive.ACTIVE,
  })
  active: UserActive;

  @Prop({
    type: String,
    required: false,
    default: null,
    select: false,
  })
  verificationCode?: string | null;

  @Prop({
    type: String,
    required: false,
    enum: Object.values(UserGender),
  })
  gender?: UserGender;
}

export const UserSchema = SchemaFactory.createForClass(User);

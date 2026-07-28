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
    // Plain-password length is validated in CreateUserDto.
    // Hashed values (bcrypt) are longer than 20 characters.
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
    default: null,
  })
  age?: number | null;

  @Prop({
    type: String,
    required: false,
    match: [
      /^01[0125][0-9]{8}$/,
      'phoneNumber must be a valid Egyptian mobile number (11 digits)',
    ],
    default: null,
  })
  phoneNumber?: string | null;

  @Prop({
    type: String,
    required: false,
    trim: true,
    default: null,
  })
  address?: string | null;

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
    enum: [...Object.values(UserGender), null],
    default: null,
  })
  gender?: UserGender | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

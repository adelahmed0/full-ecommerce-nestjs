import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserActive, UserGender, UserRole } from '../enums/user.enum';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(30, { message: 'Name must be at most 30 characters' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(3, { message: 'Password must be at least 3 characters' })
  @MaxLength(20, { message: 'Password must be at most 20 characters' })
  password: string;

  @IsEnum(UserRole, { message: 'Role must be admin or user' })
  role: UserRole;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid avatar URL' })
  avatar?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Age must be a number' })
  age?: number;

  @IsOptional()
  @IsPhoneNumber('EG', { message: 'Invalid phone number' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  @IsIn([UserActive.ACTIVE, UserActive.INACTIVE], {
    message: 'Active must be true or false',
  })
  active?: UserActive;

  @IsOptional()
  @IsString({ message: 'Verification code must be a string' })
  verificationCode?: string;

  @IsOptional()
  @IsIn([UserGender.MALE, UserGender.FEMALE], {
    message: 'Gender must be male or female',
  })
  gender?: UserGender;
}

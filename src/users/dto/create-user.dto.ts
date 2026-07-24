import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserGender, UserRole } from '../enums/user.enum';

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
  @IsInt({ message: 'Age must be an integer' })
  @Min(1, { message: 'Age must be at least 1' })
  age?: number;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Phone number must be a valid Egyptian mobile number (11 digits)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  active?: boolean;

  @IsOptional()
  @IsString({ message: 'Verification code must be a string' })
  @Length(6, 6, { message: 'Verification code must be 6 characters long' })
  verificationCode?: string;

  @IsOptional()
  @IsIn(Object.values(UserGender), {
    message: 'Gender must be male or female',
  })
  gender?: UserGender;
}

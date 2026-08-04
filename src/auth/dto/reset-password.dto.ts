import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsNotEmpty({ message: 'Code is required' })
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be 6 characters long' })
  code: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(3, { message: 'New password must be at least 3 characters' })
  @MaxLength(20, { message: 'New password must be at most 20 characters' })
  newPassword: string;
}

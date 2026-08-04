import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsNotEmpty({ message: 'Code is required' })
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be 6 characters long' })
  code: string;
}

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  @MinLength(3, { message: 'Current password must be at least 3 characters' })
  @MaxLength(20, { message: 'Current password must be at most 20 characters' })
  currentPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(3, { message: 'New password must be at least 3 characters' })
  @MaxLength(20, { message: 'New password must be at most 20 characters' })
  newPassword: string;
}

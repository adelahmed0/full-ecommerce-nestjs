import { Expose } from 'class-transformer';
import { UserActive, UserGender, UserRole } from '../enums/user.enum';
import { BaseUserIdDto } from './base-user-id.dto';

export class UserResponseDto extends BaseUserIdDto {
  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  avatar: string | null;

  @Expose()
  age: number | null;

  @Expose()
  phoneNumber: string | null;

  @Expose()
  address: string | null;

  @Expose()
  active: UserActive;

  @Expose()
  gender: UserGender | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

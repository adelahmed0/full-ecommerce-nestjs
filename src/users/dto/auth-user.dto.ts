import { Expose } from 'class-transformer';
import { UserRole } from '../enums/user.enum';
import { BaseUserIdDto } from './base-user-id.dto';

export class AuthUserDto extends BaseUserIdDto {
  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  avatar: string | null;
}

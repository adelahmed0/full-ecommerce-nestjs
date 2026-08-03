import { Expose } from 'class-transformer';
import { UserActive, UserRole } from '../enums/user.enum';
import { BaseUserIdDto } from './base-user-id.dto';

export class UserListItemDto extends BaseUserIdDto {
  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  avatar: string | null;

  @Expose()
  active: UserActive;

  @Expose()
  createdAt: Date;
}

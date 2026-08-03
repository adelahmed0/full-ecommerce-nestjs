import { Expose, Type } from 'class-transformer';
import { AuthUserDto } from '../../users/dto/auth-user.dto';

export class AuthResponseDto {
  @Expose()
  @Type(() => AuthUserDto)
  user: AuthUserDto;

  @Expose()
  accessToken: string;
}

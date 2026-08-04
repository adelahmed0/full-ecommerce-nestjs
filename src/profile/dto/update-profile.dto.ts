import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, [
    'password',
    'role',
    'active',
    'verificationCode',
  ] as const),
) {}

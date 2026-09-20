import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto/create-user.dto.js';

export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, [
    'password',
    'role',
    'active',
    'verificationCode',
  ] as const),
) {}

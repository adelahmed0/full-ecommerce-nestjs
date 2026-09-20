import { OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto/create-user.dto.js';

export class SignUpDto extends OmitType(CreateUserDto, [
  'role',
  'active',
  'verificationCode',
] as const) {}

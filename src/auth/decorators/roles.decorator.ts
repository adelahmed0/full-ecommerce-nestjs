import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user.enum';

export const Roles = Reflector.createDecorator<UserRole[]>();

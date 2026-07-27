import { Request } from 'express';
import { UserRole } from '../../users/enums/user.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export type RequestWithUser = Request & { user?: JwtPayload };

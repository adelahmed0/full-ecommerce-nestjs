import { Request } from 'express';
import { UserRole } from '../../users/enums/user.enum';

export class JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export type RequestWithUser = Request & { user?: JwtPayload };

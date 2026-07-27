import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user.enum';
import { Roles } from '../decorators/roles.decorator';
import { RequestWithUser } from '../interfaces/jwt-payload.interface';

function matchRoles(requiredRoles: UserRole[], userRole: UserRole): boolean {
  return requiredRoles.includes(userRole);
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>(Roles, context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // AuthGuard must run first and set request.user.
    if (!user || !matchRoles(roles, user.role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}

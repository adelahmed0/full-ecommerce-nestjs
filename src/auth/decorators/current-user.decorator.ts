import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  JwtPayload,
  RequestWithUser,
} from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user as JwtPayload;
  },
);

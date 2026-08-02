import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  JwtPayload,
  RequestWithUser,
} from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user as JwtPayload;

    return data ? user[data] : user;
  },
);

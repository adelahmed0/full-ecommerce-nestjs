import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiMessage } from '../enums/api-message.enum.js';

@Injectable()
export class MultipartOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const contentType = request.headers['content-type'] ?? '';

    if (!contentType.includes('multipart/form-data')) {
      throw new BadRequestException(ApiMessage.MULTIPART_FORM_DATA_REQUIRED);
    }

    return true;
  }
}

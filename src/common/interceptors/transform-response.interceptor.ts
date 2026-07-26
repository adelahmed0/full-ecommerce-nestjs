import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface SuccessResponseBody<T> {
  statusCode: number;
  message: string;
  data: T;
}

// Used when a handler carries no @ResponseMessage of its own.
const FALLBACK_MESSAGES: Record<string, string> = {
  GET: 'Fetched successfully',
  POST: 'Created successfully',
  PUT: 'Updated successfully',
  PATCH: 'Updated successfully',
  DELETE: 'Deleted successfully',
};

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseBody<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponseBody<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const message =
      this.reflector.getAllAndOverride<string | undefined>(
        RESPONSE_MESSAGE_KEY,
        [context.getHandler(), context.getClass()],
      ) ??
      FALLBACK_MESSAGES[request.method] ??
      'Success';

    return next.handle().pipe(
      map((data) => ({
        // Read after the handler ran so @HttpCode and the method default apply.
        statusCode: response.statusCode,
        message,
        data,
      })),
    );
  }
}

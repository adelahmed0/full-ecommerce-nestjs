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
import { ApiMessage } from '../enums/api-message.enum';

export interface SuccessResponseBody<T> {
  statusCode: number;
  message: string;
  data: T;
}

// Used when a handler carries no @ResponseMessage of its own.
const FALLBACK_MESSAGES: Record<string, ApiMessage> = {
  GET: ApiMessage.FETCHED,
  POST: ApiMessage.CREATED,
  PUT: ApiMessage.UPDATED,
  PATCH: ApiMessage.UPDATED,
  DELETE: ApiMessage.DELETED,
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
      ApiMessage.SUCCESS;

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

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { labelFor } from '../utils/field-label';

export interface ErrorResponseBody {
  statusCode: number;
  message: string;
  errors?: Record<string, string>;
}

interface HttpExceptionPayload {
  message?: string | string[];
  errors?: Record<string, string>;
}

const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(
  exception: unknown,
): exception is { code: number; keyValue?: Record<string, unknown> } {
  if (
    typeof exception !== 'object' ||
    exception === null ||
    !('code' in exception)
  ) {
    return false;
  }

  return exception.code === DUPLICATE_KEY_CODE;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const body = this.buildBody(exception);

    // Unexpected failures must never leak internals to the client, so the real
    // cause is only written to the server log.
    if (body.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(body.statusCode).json(body);
  }

  private buildBody(exception: unknown): ErrorResponseBody {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    if (exception instanceof MongooseError.ValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: Object.fromEntries(
          Object.entries(exception.errors).map(([field, error]) => [
            field,
            error.message,
          ]),
        ),
      };
    }

    if (exception instanceof MongooseError.CastError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: {
          [exception.path]: `${labelFor(exception.path)} is not valid`,
        },
      };
    }

    if (isDuplicateKeyError(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource already exists',
        errors: Object.fromEntries(
          Object.keys(exception.keyValue ?? {}).map((field) => [
            field,
            `${labelFor(field)} is already taken`,
          ]),
        ),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private fromHttpException(exception: HttpException): ErrorResponseBody {
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { statusCode, message: payload };
    }

    const { message, errors } = payload as HttpExceptionPayload;

    return {
      statusCode,
      message: Array.isArray(message)
        ? message.join(', ')
        : (message ?? exception.message),
      ...(errors && { errors }),
    };
  }
}

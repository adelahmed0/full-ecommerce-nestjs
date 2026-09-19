import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import multer from 'multer';
import { Observable } from 'rxjs';
import { createUploadMulterOptions } from '../upload/multer.options';

/**
 * Parses multipart/form-data (fields + files) when the request is multipart.
 * JSON/urlencoded bodies are left to Nest's default body parser.
 */
@Injectable()
export class MultipartFilesInterceptor implements NestInterceptor {
  private readonly upload: ReturnType<ReturnType<typeof multer>['any']>;

  constructor(private readonly configService: ConfigService) {
    const options = createUploadMulterOptions({
      fileSize:
        Number(this.configService.get('UPLOAD_MAX_FILE_SIZE_BYTES')) ||
        5 * 1024 * 1024,
      files: Number(this.configService.get('UPLOAD_MAX_FILES')) || 10,
    });
    // Nest MulterOptions is a wider type than multer's Options; cast for multer().
    this.upload = multer(options as Parameters<typeof multer>[0]).any();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.upload(req, res, (err: unknown) => {
        if (err) {
          subscriber.error(err);
          return;
        }

        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}

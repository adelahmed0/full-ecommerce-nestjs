import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UploadedMulterFile } from './upload.types';

type RequestWithFiles = Request & {
  files?: UploadedMulterFile[] | Record<string, UploadedMulterFile[]>;
  file?: UploadedMulterFile;
};

function getFiles(request: RequestWithFiles): UploadedMulterFile[] {
  if (!request.files) {
    return [];
  }

  if (Array.isArray(request.files)) {
    return request.files;
  }

  return Object.values(request.files).flat();
}

/** Extract one file by field name (no validation — use ParseFormFilesPipe). */
export const UploadedFormFile = createParamDecorator(
  (
    fieldName: string,
    ctx: ExecutionContext,
  ): UploadedMulterFile | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithFiles>();

    if (request.file?.fieldname === fieldName) {
      return request.file;
    }

    return getFiles(request).find((file) => file.fieldname === fieldName);
  },
);

/** Extract all files for one field name (no validation). */
export const UploadedFormFiles = createParamDecorator(
  (fieldName: string, ctx: ExecutionContext): UploadedMulterFile[] => {
    const request = ctx.switchToHttp().getRequest<RequestWithFiles>();
    return getFiles(request).filter((file) => file.fieldname === fieldName);
  },
);

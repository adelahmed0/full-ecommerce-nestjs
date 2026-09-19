import { memoryStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export type UploadLimitsConfig = {
  fileSize: number;
  files: number;
};

export function createUploadMulterOptions(
  limits: UploadLimitsConfig,
  overrides: MulterOptions = {},
): MulterOptions {
  return {
    ...overrides,
    // Default memory storage so magic-byte validation can read file.buffer.
    storage: overrides.storage ?? memoryStorage(),
    limits: {
      fileSize: limits.fileSize,
      files: limits.files,
      ...overrides.limits,
    },
  };
}

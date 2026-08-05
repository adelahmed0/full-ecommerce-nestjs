import { config as loadEnv } from 'dotenv';
import { memoryStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

loadEnv();

function readUploadLimits() {
  return {
    fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024,
    files: Number(process.env.UPLOAD_MAX_FILES) || 10,
  };
}

export function createUploadMulterOptions(
  overrides: MulterOptions = {},
): MulterOptions {
  const limits = readUploadLimits();

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

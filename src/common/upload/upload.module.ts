import { Global, Module } from '@nestjs/common';
import { LocalFileStorageService } from './local-file-storage.service.js';

@Global()
@Module({
  providers: [LocalFileStorageService],
  exports: [LocalFileStorageService],
})
export class UploadModule {}

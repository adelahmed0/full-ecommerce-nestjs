import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalFileStorageService } from './local-file-storage.service.js';

@Global()
@Module({
  providers: [
    {
      provide: LocalFileStorageService,
      useFactory: (configService: ConfigService) =>
        new LocalFileStorageService(configService),
      inject: [ConfigService],
    },
  ],
  exports: [LocalFileStorageService],
})
export class UploadModule {}

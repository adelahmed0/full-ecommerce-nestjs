import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { validationExceptionFactory } from './common/validation/validation-exception.factory.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';

async function bootstrap() {
  // Default body parser on (JSON + urlencoded). Multipart handled by MultipartFilesInterceptor.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const uploadDir = resolve(
    configService.get<string>('UPLOAD_DIR') ?? 'uploads',
  );
  const uploadPublicBasePath =
    configService.get<string>('UPLOAD_PUBLIC_BASE_PATH') ?? '/uploads';

  app.useStaticAssets(uploadDir, {
    prefix: uploadPublicBasePath.endsWith('/')
      ? uploadPublicBasePath
      : `${uploadPublicBasePath}/`,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new TransformResponseInterceptor(app.get(Reflector)),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
void bootstrap();

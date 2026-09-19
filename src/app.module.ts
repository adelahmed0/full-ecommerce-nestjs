import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { createUploadMulterOptions } from './common/upload/multer.options';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ProfileModule } from './profile/profile.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    MailModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    CategoriesModule,
  ],
  controllers: [],
  providers: [
    {
      // Global multipart/form-data parser (fields + optional files, with size limits).
      provide: APP_INTERCEPTOR,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        AnyFilesInterceptor(
          createUploadMulterOptions({
            fileSize:
              Number(configService.get('UPLOAD_MAX_FILE_SIZE_BYTES')) ||
              5 * 1024 * 1024,
            files: Number(configService.get('UPLOAD_MAX_FILES')) || 10,
          }),
        ),
    },
  ],
})
export class AppModule {}

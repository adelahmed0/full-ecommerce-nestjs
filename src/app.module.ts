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
import { CategoryModule } from './category/category.module';

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
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
      },
    }),
    MailModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    CategoryModule,
  ],
  controllers: [],
  providers: [
    {
      // Global multipart/form-data parser (fields + optional files, with size limits).
      provide: APP_INTERCEPTOR,
      useClass: AnyFilesInterceptor(createUploadMulterOptions()),
    },
  ],
})
export class AppModule {}

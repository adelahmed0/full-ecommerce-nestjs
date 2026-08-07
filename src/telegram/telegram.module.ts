import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TelegramTask,
  TelegramTaskSchema,
} from './schemas/telegram-task.schema';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelegramTask.name, schema: TelegramTaskSchema },
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}

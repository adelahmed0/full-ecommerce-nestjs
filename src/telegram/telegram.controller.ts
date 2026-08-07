import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ApiMessage } from '../common/enums/api-message.enum';
import { UserRole } from '../users/enums/user.enum';
import { TelegramService } from './telegram.service';
import type { TelegramUpdate } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  @ResponseMessage(ApiMessage.TELEGRAM_UPDATE_RECEIVED)
  async webhook(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
  ) {
    const expected = this.configService
      .get<string>('TELEGRAM_WEBHOOK_SECRET', '')
      .trim();
    if (expected && secretHeader !== expected) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }

    return this.telegramService.handleUpdate(update ?? {});
  }

  @Get('tasks')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @ResponseMessage(ApiMessage.TELEGRAM_TASKS_FETCHED)
  findRecent() {
    return this.telegramService.findRecent();
  }
}

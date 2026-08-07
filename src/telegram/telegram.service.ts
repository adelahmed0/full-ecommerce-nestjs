import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TelegramTask,
  TelegramTaskStatus,
} from './schemas/telegram-task.schema';

type TelegramChat = {
  id: number | string;
  type?: string;
  title?: string;
};

type TelegramUser = {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_bot?: boolean;
};

type TelegramMessage = {
  message_id?: number;
  text?: string;
  caption?: string;
  chat?: TelegramChat;
  from?: TelegramUser;
};

export type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(TelegramTask.name)
    private readonly telegramTaskModel: Model<TelegramTask>,
  ) {}

  private get token(): string {
    return this.configService.get<string>('TELEGRAM_BOT_TOKEN', '').trim();
  }

  private get configuredChatId(): string {
    return this.configService.get<string>('TELEGRAM_CHAT_ID', '').trim();
  }

  isConfigured(): boolean {
    return Boolean(this.token && this.configuredChatId);
  }

  async sendMessage(chatId: string | number, text: string): Promise<void> {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is missing');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Telegram sendMessage failed: ${response.status} ${body}`,
      );
    }
  }

  private extractMessage(update: TelegramUpdate): TelegramMessage | null {
    return (
      update.message || update.edited_message || update.channel_post || null
    );
  }

  private isAllowedChat(chatId: string): boolean {
    if (!this.configuredChatId) return true;
    return String(chatId) === String(this.configuredChatId);
  }

  private buildInboxPayload(task: {
    id: string;
    text: string;
    chatId: string;
    fromUsername?: string | null;
    fromFullName?: string | null;
    createdAt?: Date;
  }) {
    return [
      'التاسك: وارد من تيليجرام',
      `شرح التاسك: ${task.text}`,
      `البرانش: cursor/backend-dev-475f`,
      `المرسل: ${task.fromFullName || task.fromUsername || 'غير معروف'}`,
      `chatId: ${task.chatId}`,
      `taskId: ${task.id}`,
      `الوقت: ${task.createdAt?.toISOString?.() || new Date().toISOString()}`,
      'شغل محمود: حسب شرح عادل بعد الاستلام',
      'شغل منى: حسب شرح عادل بعد الاستلام',
      'شغل نورة: حسب شرح عادل بعد الاستلام',
      'شغل فاطمة: اختبار بعد التنفيذ',
      'الحالة: بانتظار استلام عادل وتوزيع الشغل',
      'الخطوة الجاية: /adel',
      '',
    ].join('\n');
  }

  private writeInboxFiles(content: string, taskId: string) {
    const inboxDir = path.join(process.cwd(), 'telegram-inbox');
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.writeFileSync(path.join(inboxDir, 'latest-task.txt'), content, 'utf8');
    fs.writeFileSync(path.join(inboxDir, `${taskId}.txt`), content, 'utf8');
  }

  async handleUpdate(update: TelegramUpdate) {
    if (!this.token) {
      this.logger.warn('Ignoring Telegram update: bot token missing');
      return { ok: false, reason: 'not_configured' };
    }

    const message = this.extractMessage(update);
    const text = (message?.text || message?.caption || '').trim();
    if (!message?.chat || !text) {
      return { ok: true, ignored: true };
    }

    if (message.from?.is_bot) {
      return { ok: true, ignored: true, reason: 'bot_message' };
    }

    const chatId = String(message.chat.id);
    if (!this.isAllowedChat(chatId)) {
      this.logger.warn(`Ignoring message from unexpected chat ${chatId}`);
      return { ok: true, ignored: true, reason: 'chat_not_allowed' };
    }

    // Ignore our own system-style notifications to avoid loops.
    if (text.includes('تحديث مشروع Full E-Commerce') || text.startsWith('📢')) {
      return { ok: true, ignored: true, reason: 'system_notification' };
    }

    if (update.update_id != null) {
      const exists = await this.telegramTaskModel.exists({
        updateId: update.update_id,
      });
      if (exists) {
        return { ok: true, duplicate: true };
      }
    }

    const fromFullName = [message.from?.first_name, message.from?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const task = await this.telegramTaskModel.create({
      text,
      chatId,
      messageId: message.message_id ?? null,
      fromUserId: message.from?.id != null ? String(message.from.id) : null,
      fromUsername: message.from?.username ?? null,
      fromFullName: fromFullName || null,
      status: TelegramTaskStatus.ACKNOWLEDGED,
      updateId: update.update_id ?? null,
    });

    const inbox = this.buildInboxPayload({
      id: String(task._id),
      text: task.text,
      chatId: task.chatId,
      fromUsername: task.fromUsername,
      fromFullName: task.fromFullName,
      createdAt: (task as { createdAt?: Date }).createdAt,
    });
    this.writeInboxFiles(inbox, String(task._id));

    const ack = [
      '📋 عادل استلم التاسك من تيليجرام',
      '',
      `التاسك: ${text}`,
      `رقم المتابعة: ${String(task._id)}`,
      '',
      'هوزّع الشغل على الفريق وأبلّغكم بالتحديثات هنا.',
    ].join('\n');

    await this.sendMessage(chatId, ack);

    // Also post a structured employee-style intake note to the same chat.
    const adelNote = [
      'التاسك: وارد من تيليجرام',
      `شرح التاسك: ${text}`,
      'البرانش: cursor/backend-dev-475f',
      `شغل محمود: يتحدد بعد تحليل عادل`,
      `شغل منى: يتحدد بعد تحليل عادل`,
      `شغل نورة: يتحدد بعد تحليل عادل`,
      `شغل فاطمة: اختبار بعد التنفيذ`,
      'الحالة: تم الاستلام من تيليجرام',
      'الخطوة الجاية: توزيع عادل على الفريق',
    ].join('\n');

    try {
      // Reuse notify script formatting via direct simple message if script spawn is heavy.
      await this.sendMessage(
        chatId,
        `👔 عادل — استلام تاسك\n──────────────\n${adelNote}`,
      );
    } catch (error) {
      this.logger.error('Failed to send Adel follow-up note', error as Error);
    }

    return { ok: true, taskId: String(task._id) };
  }

  findRecent(limit = 20) {
    return this.telegramTaskModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

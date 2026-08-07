import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TelegramMessageKind,
  TelegramTask,
  TelegramTaskStatus,
} from './schemas/telegram-task.schema';
import { classifyTelegramMessage } from './telegram-message.util';

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

  private writeInboxFiles(content: string, id: string) {
    const inboxDir = path.join(process.cwd(), 'telegram-inbox');
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.writeFileSync(path.join(inboxDir, 'latest-message.txt'), content, 'utf8');
    fs.writeFileSync(path.join(inboxDir, `${id}.txt`), content, 'utf8');
  }

  private buildTaskInbox(task: {
    id: string;
    text: string;
    chatId: string;
    fromUsername?: string | null;
    fromFullName?: string | null;
    createdAt?: Date;
  }) {
    return [
      'النوع: تاسك',
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

  private buildInstructionInbox(item: {
    id: string;
    text: string;
    chatId: string;
    fromUsername?: string | null;
    fromFullName?: string | null;
    createdAt?: Date;
    affected: string[];
  }) {
    return [
      'النوع: تعليمة',
      `التعليمة: ${item.text}`,
      'شرح عادل: تعليمة/قاعدة شغل من تيليجرام — مش تاسك تنفيذ',
      `المتأثرون: ${item.affected.join('، ')}`,
      'الإجراء: تسجيل وتطبيق على الشغل الجاي بدون فتح دورة تاسك',
      `البرانش: cursor/backend-dev-475f`,
      `المرسل: ${item.fromFullName || item.fromUsername || 'غير معروف'}`,
      `chatId: ${item.chatId}`,
      `instructionId: ${item.id}`,
      `الوقت: ${item.createdAt?.toISOString?.() || new Date().toISOString()}`,
      'الحالة: تم استلام التعليمة وتسجيلها',
      'الخطوة الجاية: تطبيق التعليمة على الرسائل/التاسكات الجاية',
      '',
    ].join('\n');
  }

  private analyzeInstructionAffected(text: string): string[] {
    const lower = `${text}`.toLowerCase();
    const touchesAdel = /عادل|مدير|توزيع|تفصيل|pm/i.test(text);
    const touchesNoura = /نورة|ui|ux|تصميم/i.test(lower);
    const touchesMahmoud = /محمود|backend|nestjs|api|باك/i.test(lower);
    const touchesMona = /منى|mona|react|frontend|فرونت/i.test(lower);
    const touchesFatima = /فاطمة|qa|اختبار|postman/i.test(lower);
    const touchesAll =
      /الجميع|كل التيم|الفريق|الجماعة|كل واحد|التيم كله/i.test(text);

    if (
      touchesAll ||
      (!touchesNoura &&
        !touchesMahmoud &&
        !touchesMona &&
        !touchesFatima &&
        !touchesAdel)
    ) {
      return ['كل الفريق'];
    }

    const affected: string[] = [];
    if (touchesAdel) affected.push('عادل');
    if (touchesNoura) affected.push('نورة');
    if (touchesMahmoud) affected.push('محمود');
    if (touchesMona) affected.push('منى');
    if (touchesFatima) affected.push('فاطمة');
    return affected;
  }

  private async handleInstruction(params: {
    text: string;
    chatId: string;
    message: TelegramMessage;
    update: TelegramUpdate;
    fromFullName: string;
  }) {
    const { text, chatId, message, update, fromFullName } = params;
    const affected = this.analyzeInstructionAffected(text);

    const record = await this.telegramTaskModel.create({
      kind: TelegramMessageKind.INSTRUCTION,
      text,
      chatId,
      messageId: message.message_id ?? null,
      fromUserId: message.from?.id != null ? String(message.from.id) : null,
      fromUsername: message.from?.username ?? null,
      fromFullName: fromFullName || null,
      status: TelegramTaskStatus.ACKNOWLEDGED,
      updateId: update.update_id ?? null,
    });

    const id = String(record._id);
    const inbox = this.buildInstructionInbox({
      id,
      text,
      chatId,
      fromUsername: record.fromUsername,
      fromFullName: record.fromFullName,
      createdAt: (record as { createdAt?: Date }).createdAt,
      affected,
    });
    this.writeInboxFiles(inbox, id);
    fs.writeFileSync(
      path.join(process.cwd(), 'telegram-inbox', 'latest-instruction.txt'),
      inbox,
      'utf8',
    );

    await this.sendMessage(
      chatId,
      [
        '📥 تم استلام التعليمة',
        `رقم المتابعة: ${id}`,
        '',
        'عادل هيسجّلها ويوضّح تأثيرها — من غير فتح تاسك.',
      ].join('\n'),
    );

    await this.sendMessage(
      chatId,
      [
        '📌 رد عادل على التعليمة',
        `التعليمة: ${text}`,
        `رقم المتابعة: ${id}`,
        '',
        'فهمت إنها تعليمة/قاعدة شغل.',
        `المتأثرون: ${affected.join('، ')}`,
        'هتتعمل إزاي: تسجيل وتطبيق على الشغل الجاي — بدون دورة تنفيذ',
        '',
        'دي مش تاسك. لو عايز شغل تنفيذي: تاسك: وصف الشغل',
      ].join('\n'),
    );

    return { ok: true, kind: 'instruction', instructionId: id };
  }

  private async handleTask(params: {
    text: string;
    chatId: string;
    message: TelegramMessage;
    update: TelegramUpdate;
    fromFullName: string;
  }) {
    const { text, chatId, message, update, fromFullName } = params;

    const task = await this.telegramTaskModel.create({
      kind: TelegramMessageKind.TASK,
      text,
      chatId,
      messageId: message.message_id ?? null,
      fromUserId: message.from?.id != null ? String(message.from.id) : null,
      fromUsername: message.from?.username ?? null,
      fromFullName: fromFullName || null,
      status: TelegramTaskStatus.ACKNOWLEDGED,
      updateId: update.update_id ?? null,
    });

    const inbox = this.buildTaskInbox({
      id: String(task._id),
      text: task.text,
      chatId: task.chatId,
      fromUsername: task.fromUsername,
      fromFullName: task.fromFullName,
      createdAt: (task as { createdAt?: Date }).createdAt,
    });
    this.writeInboxFiles(inbox, String(task._id));
    fs.writeFileSync(
      path.join(process.cwd(), 'telegram-inbox', 'latest-task.txt'),
      inbox,
      'utf8',
    );

    const taskId = String(task._id);
    await this.sendMessage(
      chatId,
      [
        '📋 تم استلام التاسك',
        `رقم المتابعة: ${taskId}`,
        '',
        'عادل هيفصّل التاسك دلوقتي: كل واحد هيعمل إيه — من غير تنفيذ.',
      ].join('\n'),
    );

    const lower = text.toLowerCase();
    const needsBackend = /api|crud|endpoint|backend|nestjs|باك|ايند/.test(
      `${lower} ${text}`,
    );
    const needsFrontend = /react|frontend|ui|ux|موقع|فرونت|واجهة|تصميم/.test(
      `${lower} ${text}`,
    );
    const noura = needsFrontend ? 'تصميم التدفقات والشاشات' : 'غير مطلوب';
    const mahmoud =
      needsBackend || !needsFrontend
        ? 'تنفيذ/تجهيز جزء الـ Backend API'
        : 'دعم الـ API لو منى احتاجت';
    const mona = needsFrontend ? 'تنفيذ React وربط الموقع' : 'غير مطلوب';
    const fatima = needsFrontend
      ? 'اختبار Postman + تجربة الموقع على كل أحجام الشاشات'
      : 'اختبار Postman للـ endpoints';

    const plan: string[] = [];
    if (needsFrontend) plan.push('1) نورة تبدأ تصميم UI/UX');
    plan.push(`${plan.length + 1}) محمود ينفّذ Backend`);
    if (needsFrontend) {
      plan.push(`${plan.length + 1}) منى تنفّذ React وتربط الـ API`);
    }
    plan.push(`${plan.length + 1}) فاطمة تختبر`);
    plan.push(`${plan.length + 1}) إصلاحات لو لزم ثم قبول/إغلاق`);

    try {
      await this.sendMessage(
        chatId,
        [
          '📌 توزيع عادل — تفصيل فقط (بدون تنفيذ)',
          `التاسك: ${text}`,
          `رقم المتابعة: ${taskId}`,
          '',
          'مين هيعمل إيه:',
          `🎨 نورة: ${noura}`,
          `🛠️ محمود: ${mahmoud}`,
          `⚛️ منى: ${mona}`,
          `✅ فاطمة: ${fatima}`,
          '',
          'إيه اللي هيحصل:',
          ...plan,
          '',
          'عادل خلص دوره بالتفصيل. التنفيذ بعد استدعاء الموظفين.',
        ].join('\n'),
      );
    } catch (error) {
      this.logger.error('Failed to send Adel distribution plan', error as Error);
    }

    return { ok: true, kind: 'task', taskId };
  }

  async handleUpdate(update: TelegramUpdate) {
    if (!this.token) {
      this.logger.warn('Ignoring Telegram update: bot token missing');
      return { ok: false, reason: 'not_configured' };
    }

    const message = this.extractMessage(update);
    const rawText = (message?.text || message?.caption || '').trim();
    if (!message?.chat || !rawText) {
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

    if (
      rawText.includes('تحديث مشروع Full E-Commerce') ||
      rawText.startsWith('📢') ||
      rawText.startsWith('📥 تم استلام') ||
      rawText.startsWith('📋 تم استلام') ||
      rawText.startsWith('📌')
    ) {
      return { ok: true, ignored: true, reason: 'system_notification' };
    }

    if (
      rawText === '/status' ||
      rawText.startsWith('/status@') ||
      rawText === '/done' ||
      rawText.startsWith('/done ') ||
      rawText.startsWith('/done@') ||
      rawText === '/instructions' ||
      rawText.startsWith('/instructions@')
    ) {
      return { ok: true, ignored: true, reason: 'command_handled_by_poller' };
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

    const classified = classifyTelegramMessage(rawText);
    if (classified.emptyBody) {
      await this.sendMessage(
        chatId,
        [
          'اكتب محتوى بعد الأمر.',
          'مثال: تعليمة: ممنوع الشغل على master',
          'أو: تاسك: CRUD للـ Brand',
        ].join('\n'),
      );
      return { ok: true, kind: 'empty' };
    }

    if (classified.kind === 'instruction') {
      return this.handleInstruction({
        text: classified.text,
        chatId,
        message,
        update,
        fromFullName,
      });
    }

    return this.handleTask({
      text: classified.text,
      chatId,
      message,
      update,
      fromFullName,
    });
  }

  findRecent(limit = 20) {
    return this.telegramTaskModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

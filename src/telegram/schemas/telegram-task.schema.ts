import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyDocumentJsonTransform } from '../../common/utils/mongoose-document.util';

export type TelegramTaskDocument = HydratedDocument<TelegramTask>;

export enum TelegramTaskStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TelegramMessageKind {
  TASK = 'task',
  INSTRUCTION = 'instruction',
}

@Schema({ timestamps: true })
export class TelegramTask {
  @Prop({
    required: true,
    enum: Object.values(TelegramMessageKind),
    default: TelegramMessageKind.TASK,
  })
  kind: TelegramMessageKind;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ required: true })
  chatId: string;

  @Prop({ required: false, default: null })
  messageId?: number | null;

  @Prop({ required: false, default: null })
  fromUserId?: string | null;

  @Prop({ required: false, default: null })
  fromUsername?: string | null;

  @Prop({ required: false, default: null })
  fromFullName?: string | null;

  @Prop({
    required: true,
    enum: Object.values(TelegramTaskStatus),
    default: TelegramTaskStatus.NEW,
  })
  status: TelegramTaskStatus;

  @Prop({ required: false, default: null })
  updateId?: number | null;
}

export const TelegramTaskSchema = SchemaFactory.createForClass(TelegramTask);
applyDocumentJsonTransform(TelegramTaskSchema);
TelegramTaskSchema.index({ updateId: 1 }, { unique: true, sparse: true });

import { type InlineKeyboardMarkup } from 'node-telegram-bot-api';

import { type Env } from '../../env';
import { stringify } from '../../utils/callback-data';
import { ResponseCallbackType } from '../callback-data.interface';
import { TelegramApi } from '../telegram-api';

export interface Context {
  env: Env;
  query: string;
  chatId: number;
  messageId: number;
  originMessageId: number | null;
  caption?: string;
  tg: TelegramApi;
  initiatorId: number;
}

export abstract class Plugin {
  protected readonly api: TelegramApi;
  protected readonly replyTo: number;

  constructor(protected readonly ctx: Context) {
    this.api = ctx.tg;
    this.replyTo = ctx.originMessageId ?? ctx.messageId;
  }

  public abstract processAndRespond(resultNum: number): Promise<void>;

  protected async noneFound() {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: 'Не нашел \u{1F614}',
      reply_to_message_id: this.replyTo,
      disable_notification: true,
    });
  }

  protected getKeyboard(resultNumber: number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: 'del',
            callback_data: stringify({ callback: ResponseCallbackType.Delete, ownerId: this.ctx.initiatorId }),
          },
          {
            text: 're:',
            callback_data: stringify({
              callback: ResponseCallbackType.Retry,
              plugin: this.constructor.name,
              resultNumber,
              ownerId: this.ctx.initiatorId,
            }),
          },
          {
            text: 'moar!',
            callback_data: stringify({
              callback: ResponseCallbackType.More,
              plugin: this.constructor.name,
              resultNumber,
              ownerId: this.ctx.initiatorId,
            }),
          },
        ],
      ],
    };
  }
}

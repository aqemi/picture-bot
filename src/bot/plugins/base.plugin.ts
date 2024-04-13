import { type InlineKeyboardMarkup } from 'node-telegram-bot-api';

import { type Env } from '../../env';
import { ResponseCallbackType, stringify } from '../../utils/callback-data';
import { type TelegramApi } from '../telegram-api';

export type Context = {
  query: string;
  chatId: number;
  invokeMessageId: number;
  repliedMessageId: number | null;
  caption: string | null;
  initiatorId: number;
};

export abstract class Plugin {
  protected readonly replyTo: number;

  constructor(
    protected readonly ctx: Context,
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {
    this.replyTo = ctx.repliedMessageId ?? ctx.invokeMessageId;
  }

  public abstract processAndRespond(arg: { resultNumber: number }): Promise<void>;

  protected async notFound() {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: 'Не нашел \u{1F614}',
      reply_to_message_id: this.replyTo,
      disable_notification: true,
    });
  }

  static get matcher(): RegExp {
    throw new Error(`Matcher is not set on ${this.name} plugin`);
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

export type PluginDerived = { new (ctx: Context, api: TelegramApi, env: Env): Plugin } & typeof Plugin;

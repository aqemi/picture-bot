import { type InlineKeyboardMarkup } from 'node-telegram-bot-api';

import { ResponseCallbackType, stringify } from '../../utils/callback-data';
import { type TelegramApi } from '../telegram-api';

export type InvocationContext = {
  chatId: number;
  messageId: number;
  replyToId?: number;
  caption?: string;
  initiatorId: number;
  initiatorName: string;
  text: string;
  replyToText?: string;
  businessConnectionId?: string;
};

export abstract class BasePlugin {
  constructor(
    protected readonly ctx: InvocationContext,
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {}

  public abstract match(): boolean | Promise<boolean>;
  public abstract run(arg: object): Promise<void>;

  protected getKeyboard(resultNumber: number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: 'del',
            callback_data: stringify({ type: ResponseCallbackType.Delete, ownerId: this.ctx.initiatorId }),
          },
          {
            text: 're:',
            callback_data: stringify({
              type: ResponseCallbackType.Retry,
              plugin: this.constructor.name,
              resultNumber,
              ownerId: this.ctx.initiatorId,
            }),
          },
          {
            text: 'moar!',
            callback_data: stringify({
              type: ResponseCallbackType.More,
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

export type PluginDerived = {
  new (ctx: InvocationContext, api: TelegramApi, env: Env): BasePlugin;
} & typeof BasePlugin;

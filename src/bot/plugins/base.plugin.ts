import { ChatId, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { Env } from '../../env';
import { TelegramApi } from '../telegram-api';

export interface Context {
  env: Env;
  query: string;
  chatId: ChatId;
  replyTo: number;
  caption?: string;
}

export abstract class Plugin {
  protected readonly api: TelegramApi;

  constructor(protected readonly ctx: Context) {
    this.api = new TelegramApi(ctx.env.TG_TOKEN);
  }

  public abstract processAndRespond(resultNum: number): Promise<void>;

  protected async noneFound() {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: 'Не нашел \u{1F614}',
      reply_to_message_id: this.ctx.replyTo,
      disable_notification: true,
    });
  }

  protected getMoreButton(resultNum: number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [[{ text: 'moar!', callback_data: resultNum.toString() }]],
    };
  }
}

import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import type { TelegramApi } from '../telegram-api';
import { FetchError } from '../../utils';
import { decorateError } from '../../utils/decorate-error';

type ReportErrorOptions = { chatId: number; replyTo?: number };

export abstract class TelegramUpdateHandler {
  constructor(
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {
    const pattern = Object.values(env)
      .filter((x) => typeof x === 'string')
      .join('|');
    this.sanitizeExpr = new RegExp(pattern, 'g');
  }

  private sanitizeExpr: RegExp;

  public abstract match(payload: TelegramUpdate): boolean;

  public abstract handle(payload: TelegramUpdate): Promise<void>;

  protected async reportError(err: unknown, { chatId, replyTo }: ReportErrorOptions): Promise<void> {
    console.error(err);
    const typedError = this.ensureError(err);
    if (typedError instanceof FetchError) {
      typedError.url = this.sanitize(typedError.url);
    }
    delete typedError.stack;
    const decoratedError = decorateError(typedError);
    await this.api.sendJSON({ chat_id: chatId, json: decoratedError, reply_to_message_id: replyTo });
  }

  private ensureError(err: unknown): Error {
    return err instanceof Error ? err : new Error(JSON.stringify(err));
  }

  private sanitize(text: string): string {
    return text.replace(this.sanitizeExpr, '<REDACTED>');
  }

  protected async removeKeyboard(chatId: number, messageId: number) {
    try {
      await this.api.editMessageReplyMarkup({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: undefined,
      });
    } catch (err) {
      console.error(err);
    }
  }

  protected get botUsername(): string {
    return `${this.env.BOT_USERNAME}_bot`;
  }

  protected get botMention(): string {
    return `@${this.botUsername}`;
  }
}

export type TelegramUpdateHandlerDerived = {
  new (api: TelegramApi, env: Env): TelegramUpdateHandler;
} & typeof TelegramUpdateHandler;

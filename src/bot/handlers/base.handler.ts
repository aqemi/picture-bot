import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import type { Env } from '../../env';
import type { TelegramApi } from '../telegram-api';

type ReportErrorOptions = {
  chatId: number;
  replyTo?: number;
};

export abstract class TelegramUpdateHandler {
  constructor(
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {}

  public abstract match(payload: TelegramUpdate): boolean;

  public abstract handle(payload: TelegramUpdate): Promise<void>;

  protected async reportError(err: unknown, { chatId, replyTo }: ReportErrorOptions): Promise<void> {
    console.error(err);
    const typedError = this.ensureError(err);
    await this.api.sendMessage({
      chat_id: chatId,
      text: `\`\`\`${typedError}\`\`\``,
      reply_to_message_id: replyTo,
      parse_mode: 'MarkdownV2',
      disable_notification: true,
    });
  }

  private ensureError(err: unknown): Error {
    return err instanceof Error ? err : new Error(JSON.stringify(err));
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
}

export type TelegramUpdateHandlerDerived = { new (api: TelegramApi, env: Env): TelegramUpdateHandler } & typeof TelegramUpdateHandler;

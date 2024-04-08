import { commands, directlyInvokedPlugins } from './commands';
import { type Context as PluginContext } from './plugins';
import { ResponseCallbackData, ResponseCallbackType } from './callback-data.interface';

interface BotContext extends Omit<PluginContext, 'query'> {
  /**
   * Text to which user replies
   */
  originText: string | null;
  /**
   * Message to which user replies
   */
  originMessageId: number | null;
  /**
   * Message that triggered bot
   */
  messageId: number;
  /**
   * User who initiated query
   */
  initiatorId: number;
}

interface InvokeContext {
  /**
   * Text in message that triggered bot
   */
  text: string;
}

interface CallbackContext extends ResponseCallbackData {
  /**
   * User who initiated callback
   */
  initiatorId: number;
  callbackQueryId: string;
}

export class Bot {
  constructor(private readonly ctx: BotContext) {}

  public async parseMessageAndRespond(ctx: InvokeContext): Promise<void> {
    const { text } = ctx;
    const { env, originText } = this.ctx;
    try {
      for (const [regex, Plugin] of commands) {
        if (regex.test(text)) {
          const [, match] = text.match(regex) ?? [];
          const query = match === undefined && originText ? originText : match;
          if (!query) {
            if (env.NODE_ENV === 'development') {
              console.debug(`No match for text ${text}`);
            }
            return;
          }
          return await new Plugin({ ...this.ctx, query }).processAndRespond(0);
        }
      }
    } catch (err: any) {
      await this.onError(err);
    }
  }

  private async onError(err: Error): Promise<void> {
    console.error(err);

    await this.ctx.tg.sendMessage({
      chat_id: this.ctx.chatId,
      text: `\`\`\`${err?.name}: ${err?.message}\`\`\``,
      reply_to_message_id: this.ctx.originMessageId ?? this.ctx.messageId,
      parse_mode: 'MarkdownV2',
      disable_notification: true,
    });
  }
  public async answerCallback(ctx: CallbackContext): Promise<void> {
    try {
      switch (ctx.callback) {
        case ResponseCallbackType.Delete: {
          await this.deleteResponse(ctx);
          break;
        }
        case ResponseCallbackType.Retry: {
          await this.retry(ctx);
          break;
        }
        case ResponseCallbackType.More: {
          await this.removeKeyboard();
          await this.loadMore(ctx);
          break;
        }
        default: {
          throw new Error(`Unknown callback ${ctx.callback}`);
        }
      }
    } catch (err: any) {
      await this.onError(err);
    }
  }

  private async deleteResponse(callbackContext: CallbackContext): Promise<boolean> {
    if (callbackContext.initiatorId !== this.ctx.initiatorId) {
      await this.ctx.tg.answerCallbackQuery({
        callback_query_id: callbackContext.callbackQueryId,
        text: 'иди нахуй, пидор',
        show_alert: true,
      });
      return false;
    }
    await this.ctx.tg.deleteMessage({ chat_id: this.ctx.chatId, message_id: this.ctx.messageId });
    return true;
  }

  private async retry(ctx: CallbackContext): Promise<void> {
    const deleted = await this.deleteResponse(ctx);
    if (deleted) {
      await this.loadMore(ctx);
    }
  }

  private async loadMore(ctx: CallbackContext): Promise<void> {
    const { plugin, resultNumber } = ctx;
    const { originText } = this.ctx;
    const Plugin = directlyInvokedPlugins.find((x) => x.name === plugin);
    if (!Plugin) {
      throw new Error(`Unknown plugin ${plugin}`);
    }
    if (!resultNumber) {
      throw new Error(`originText is null`);
    }
    if (!originText) {
      throw new Error(`originText is null`);
    }
    return await new Plugin({ ...this.ctx, query: originText }).processAndRespond(resultNumber);
  }

  private async removeKeyboard() {
    try {
      await this.ctx.tg.editMessageReplyMarkup({
        chat_id: this.ctx.chatId,
        message_id: this.ctx.messageId,
        reply_markup: undefined,
      });
    } catch (err) {
      console.error(err);
    }
  }
}

import { commands, directlyInvokedPlugins } from './commands';
import { type Context as PluginContext } from './plugins';
import { ResponseCallbackData, ResponseCallbackType } from './callback-data.interface';

interface BotContext extends Omit<PluginContext, 'query'> {
  originText: string;
  messageId: number;
}

interface InvokeContext {
  text: string;
}

interface CallbackContext extends ResponseCallbackData {}

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
      reply_to_message_id: this.ctx.replyTo,
      parse_mode: 'MarkdownV2',
      disable_notification: true,
    });
  }
  public async answerCallback(ctx: CallbackContext): Promise<void> {
    try {
      switch (ctx.callback) {
        case ResponseCallbackType.Delete: {
          return await this.deleteResponse();
        }
        case ResponseCallbackType.Retry: {
          return await this.retry(ctx);
        }
        case ResponseCallbackType.More: {
          return await this.loadMore(ctx);
        }
        default: {
          throw new Error(`Unknown callback ${ctx.callback}`);
        }
      }
    } catch (err: any) {
      await this.onError(err);
    }
  }

  private async deleteResponse(): Promise<void> {
    await this.ctx.tg.deleteMessage({ chat_id: this.ctx.chatId, message_id: this.ctx.messageId });
  }

  private async retry(ctx: CallbackContext): Promise<void> {
    await this.deleteResponse();
    await this.loadMore(ctx);
  }

  private async loadMore(ctx: CallbackContext): Promise<void> {
    const { plugin, resultNumber } = ctx;
    const Plugin = directlyInvokedPlugins.find((x) => x.name === plugin);
    if (!Plugin) {
      throw new Error(`Unknown plugin ${plugin}`);
    }
    if (!resultNumber) {
      throw new Error(`resultNumber undefined`);
    }
    return await new Plugin({ ...this.ctx, query: this.ctx.originText }).processAndRespond(resultNumber);
  }
}

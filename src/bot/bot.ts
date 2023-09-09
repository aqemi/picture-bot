import type { ChatId } from 'node-telegram-bot-api';
import { Env } from '../env';
import { TelegramApi } from './telegram-api';
import { commands, directlyInvokedPlugins } from './commands';

interface Context {
  env: Env;
  text: string;
  type?: string;
  chatId: ChatId;
  replyTo: number;
  replyToText?: string;
  caption?: string;
  resultNumber: number;
}

export async function parseAndRespond({ type, text, resultNumber, replyToText, ...ctx }: Context): Promise<void> {
  try {
    /**
     * Regular query aka image apple
     */
    for (const [regex, Plugin] of commands) {
      if (regex.test(text)) {
        const [, match] = text.match(regex) ?? [];
        const query = !match && replyToText ? replyToText : match;
        if (!query) {
          return;
        }
        return await new Plugin({ ...ctx, query }).processAndRespond(resultNumber);
      }
    }

    /**
     * Invoke via reply aka reply as "image" to "apple"
     */
    if (type) {
      const Plugin = directlyInvokedPlugins.find((x) => x.name === type);
      if (!Plugin) {
        throw new Error(`Unknown plugin ${type}`);
      }
      return await new Plugin({ ...ctx, query: text }).processAndRespond(resultNumber);
    }

    /**
     * No match
     */
    if (ctx.env.NODE_ENV === 'development') {
      console.debug(`No match for text ${text}`);
    }
  } catch (err: any) {
    console.error(err);

    await new TelegramApi(ctx.env.TG_TOKEN).sendMessage({
      chat_id: ctx.chatId,
      text: `\`\`\`${err?.name}: ${err?.message}\`\`\``,
      reply_to_message_id: ctx.replyTo,
      parse_mode: 'MarkdownV2',
      disable_notification: true,
    });
  }
}

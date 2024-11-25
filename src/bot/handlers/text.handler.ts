import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { Context, GoogleImageSearch, Keyboard, PluginDerived, Tenor, Test, Youtube } from '../plugins';
import { TelegramUpdateHandler } from './base.handler';

const plugins: PluginDerived[] = [GoogleImageSearch, Youtube, Tenor, Keyboard, Test];

export class TelegramTextHandler extends TelegramUpdateHandler {
  match(payload: TelegramUpdate) {
    return !!payload?.message?.text;
  }

  async handle(payload: TelegramUpdate) {
    const chatId = defined(payload.message?.chat.id, 'chatId');
    const replyTo = defined(payload.message?.reply_to_message?.message_id ?? payload.message?.message_id, 'replyTo');
    try {
      const text = defined(payload.message?.text, 'text');
      const repliedText = payload.message?.reply_to_message?.text;
      for (const Plugin of plugins) {
        if (Plugin.matcher.test(text)) {
          const [, match] = text.match(Plugin.matcher) ?? [];
          const query = match === undefined && repliedText ? repliedText : match;
          if (!query) {
            if (this.env.NODE_ENV === 'development') {
              console.debug(`No match for text ${text} in ${Plugin.name}`, payload);
            }
            return;
          }
          const ctx: Context = {
            query,
            chatId,
            invokeMessageId: defined(payload.message?.message_id, 'invokeMessageId'),
            repliedMessageId: payload.message?.reply_to_message?.message_id ?? null,
            initiatorId: defined(payload.message?.from?.id, 'initiatorId'),
            caption: null,
          };
          return await new Plugin(ctx, this.api, this.env).processAndRespond({ resultNumber: 0 });
        }
      }
      console.debug(`No match for text ${text}`, payload);
    } catch (err) {
      await this.reportError(err, { chatId, replyTo });
    }
  }
}

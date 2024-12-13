import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { GoogleImageSearch, InvocationContext, Keyboard, PluginDerived, Tenor, Test, Youtube } from '../plugins';
import { MistralePlugin } from '../plugins/mistrale/mistrale.plugin';
import { RestartPromptPlugin } from '../plugins/mistrale/restart.plugin';
import { TelegramUpdateHandler } from './base.handler';

const plugins: PluginDerived[] = [
  GoogleImageSearch,
  Youtube,
  Tenor,
  Keyboard,
  Test,
  RestartPromptPlugin,
  MistralePlugin,
];

export class TelegramTextHandler extends TelegramUpdateHandler {
  match(payload: TelegramUpdate) {
    return !!payload?.message?.text;
  }

  async handle(payload: TelegramUpdate) {
    const chatId = defined(payload.message?.chat.id, 'chatId');
    try {
      const ctx: InvocationContext = {
        chatId,
        messageId: defined(payload.message?.message_id, 'message.message_id'),
        replyToId: payload.message?.reply_to_message?.message_id,
        initiatorId: defined(payload.message?.from?.id, 'message.from.id'),
        initiatorName: defined(payload.message?.from?.username ?? payload.message?.from?.first_name, 'message?.from?.first_name'),
        text: defined(payload.message?.text, 'message.text'),
        replyToText: payload.message?.reply_to_message?.text,
        replyToThisBot: payload.message?.reply_to_message?.from?.username === this.botUsername,
      };

      for (const Plugin of plugins) {
        const plugin = new Plugin(ctx, this.api, this.env);
        if (await plugin.match()) {
          return await plugin.run({});
        }
      }

      console.debug('No match for message', payload);
    } catch (err) {
      await this.reportError(err, { chatId, replyTo: payload.message?.message_id });
    }
  }
}

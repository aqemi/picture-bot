import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { GoogleImageSearch, InvocationContext, Keyboard, PluginDerived, Tenor, Youtube } from '../plugins';
import { RestartPromptPlugin } from '../plugins/mistrale/restart.plugin';
import { TelegramUpdateHandler } from './base.handler';

const plugins: PluginDerived[] = [GoogleImageSearch, Youtube, Tenor, Keyboard, RestartPromptPlugin];

export class TelegramTextHandler extends TelegramUpdateHandler {
  async match(payload: TelegramUpdate) {
    return !!payload?.message?.text;
  }

  async handle(payload: TelegramUpdate) {
    const { message } = payload;
    const chatId = defined(message?.chat.id, 'chatId');
    try {
      const ctx: InvocationContext = {
        chatId,
        messageId: defined(message?.message_id, 'message.message_id'),
        replyToId: message?.reply_to_message?.message_id,
        initiatorId: defined(message?.from?.id, 'message.from.id'),
        initiatorName: defined(message?.from?.username ?? message?.from?.first_name, 'message?.from?.first_name'),
        text: defined(message?.text, 'message.text'),
        replyToText: message?.reply_to_message?.text,
      };

      for (const Plugin of plugins) {
        const plugin = new Plugin(ctx, this.api, this.env, this.responseHelper);
        if (await plugin.match()) {
          return await plugin.run({});
        }
      }

      console.debug('No match for message', payload);
    } catch (error) {
      await this.responseHelper.sendError(chatId, error, message?.message_id);
    }
  }
}

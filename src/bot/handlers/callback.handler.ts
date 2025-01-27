import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { ResponseCallbackData, ResponseCallbackType, parse } from '../../utils/callback-data';
import { mention } from '../../utils/mention';
import { GoogleImageSearch, InvocationContext, Tenor, Youtube } from '../plugins';
import { RegexBasedPluginDerived } from '../plugins/regex-based.plugin';
import { TelegramUpdateHandler } from './base.handler';

const plugins: RegexBasedPluginDerived[] = [GoogleImageSearch, Youtube, Tenor];

type Callback = ResponseCallbackData & {
  queryId: string;
};

export class TelegramCallbackHandler extends TelegramUpdateHandler {
  match(payload: TelegramUpdate) {
    return !!payload.callback_query?.message?.reply_to_message?.text; // TODO make more reliable
  }

  async handle(payload: TelegramUpdate) {
    const chatId = defined(payload.callback_query?.message?.chat.id, 'callback_query.message.chat.id');
    try {
      const data = parse(payload.callback_query?.data ?? '');

      const callback: Callback = {
        ...data,
        queryId: defined(payload.callback_query?.id, 'payload.callback_query?.id'),
      };

      const ctx: InvocationContext = {
        initiatorId: defined(payload.callback_query?.from.id, 'callback_query.from.id'),
        initiatorName: defined(payload.callback_query?.from.first_name, 'callback_query.from.first_name'),
        chatId,
        messageId: defined(payload.callback_query?.message?.message_id, 'callback_query.message.message_id'),
        replyToId: defined(
          payload.callback_query?.message?.reply_to_message?.message_id,
          'callback_query.message.reply_to_message.message_id',
        ),
        caption: mention(defined(payload.callback_query?.from, 'callback_query.from')),
        text: payload.callback_query?.message?.text ?? '',
        replyToText: defined(
          payload.callback_query?.message?.reply_to_message?.text,
          'callback_query.message.reply_to_message.text',
        ),
        replyToThisBot: false, // callback buttons are always on bot messages and bot does not reply to itself
      };

      switch (callback.type) {
        case ResponseCallbackType.Delete: {
          await this.deleteResponse(ctx, callback);
          break;
        }
        case ResponseCallbackType.Retry: {
          await this.retry(ctx, callback);
          break;
        }
        case ResponseCallbackType.More: {
          await this.removeKeyboard(ctx.chatId, ctx.messageId);
          await this.loadMore(ctx, callback);
          break;
        }
        default: {
          throw new Error(`Unknown callback ${callback.type}`);
        }
      }
    } catch (err) {
      await this.reportError(err, { chatId });
    }
  }

  private async deleteResponse(ctx: InvocationContext, callback: Callback): Promise<boolean> {
    if (ctx.initiatorId !== callback.ownerId) {
      await this.api.answerCallbackQuery({
        callback_query_id: callback.queryId,
        text: '',
        show_alert: true,
      });
      return false;
    }
    await this.api.deleteMessage({ chat_id: ctx.chatId, message_id: ctx.messageId });
    return true;
  }

  private async retry(ctx: InvocationContext, callback: Callback): Promise<void> {
    const deleted = await this.deleteResponse(ctx, callback);
    if (deleted) {
      await this.loadMore(ctx, callback);
    }
  }

  private async loadMore(ctx: InvocationContext, callback: Callback): Promise<void> {
    const { plugin, resultNumber } = callback;
    const Plugin = plugins.find((x) => x.name === plugin);
    if (!Plugin) {
      throw new Error(`Unknown plugin ${plugin}`);
    }
    return await new Plugin(ctx, this.api, this.env).run({ resultNumber: defined(resultNumber, 'resultNumber') });
  }
}

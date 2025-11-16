import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { ResponseCallbackData, ResponseCallbackType, parse } from '../../utils/callback-data';
import { mention } from '../../utils/mention';
import { GoogleImageSearch, InvocationContext, Tenor, Youtube } from '../plugins';
import { RegexBasedPluginDerived } from '../plugins/regex-based.plugin';
import { TelegramUpdateHandler } from './base.handler';
import { DrawPlugin } from '../plugins/draw/draw.plugin';

const plugins: RegexBasedPluginDerived[] = [GoogleImageSearch, Youtube, Tenor, DrawPlugin];

type Callback = ResponseCallbackData & {
  queryId: string;
};

export class TelegramCallbackHandler extends TelegramUpdateHandler {
  async match(payload: TelegramUpdate) {
    return !!payload.callback_query?.message?.reply_to_message?.text; // TODO make more reliable
  }

  async handle(payload: TelegramUpdate) {
    const { callback_query } = payload;
    const chatId = defined(callback_query?.message?.chat.id, 'callback_query.message.chat.id');
    try {
      const data = parse(callback_query?.data ?? '');

      const callback: Callback = {
        ...data,
        queryId: defined(callback_query?.id, 'callback_query?.id'),
      };

      const ctx: InvocationContext = {
        initiatorId: defined(callback_query?.from.id, 'callback_query.from.id'),
        initiatorName: defined(callback_query?.from.first_name, 'callback_query.from.first_name'),
        chatId,
        messageId: defined(callback_query?.message?.message_id, 'callback_query.message.message_id'),
        replyToId: defined(
          callback_query?.message?.reply_to_message?.message_id,
          'callback_query.message.reply_to_message.message_id',
        ),
        caption: mention(defined(callback_query?.from, 'callback_query.from')),
        text: callback_query?.message?.text ?? '',
        replyToText: defined(
          callback_query?.message?.reply_to_message?.text,
          'callback_query.message.reply_to_message.text',
        ),
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
          await this.responseHelper.removeKeyboard(ctx.chatId, ctx.messageId);
          await this.loadMore(ctx, callback);
          break;
        }
        default: {
          throw new Error(`Unknown callback ${callback.type}`);
        }
      }
    } catch (error) {
      console.error('Error in callback handler ', error);
      await this.responseHelper.sendError(chatId, error);
    }
  }

  private async deleteResponse(ctx: InvocationContext, callback: Callback): Promise<boolean> {
    if (ctx.initiatorId !== callback.ownerId) {
      await this.api.answerCallbackQuery({
        callback_query_id: callback.queryId,
        text: 'Не твой ответ, не трогай',
        show_alert: false,
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
    return await new Plugin(ctx, this.api, this.env, this.responseHelper).run({
      resultNumber: defined(resultNumber, 'resultNumber'),
    });
  }
}

import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { ResponseCallbackData, ResponseCallbackType, parse } from '../../utils/callback-data';
import { mention } from '../../utils/mention';
import { InvocationContext, GoogleImageSearch, Tenor, Youtube } from '../plugins';
import { TelegramUpdateHandler } from './base.handler';
import { RegexBasedPluginDerived } from '../plugins/regex-based.plugin';

const plugins: RegexBasedPluginDerived[] = [GoogleImageSearch, Youtube, Tenor];

type CallbackContext = InvocationContext &
  ResponseCallbackData & {
    /**
     * User who initiated callback
     */
    initiatorId: number;
    callbackQueryId: string;
    chatId: number;
  };

export class TelegramCallbackHandler extends TelegramUpdateHandler {
  match(payload: TelegramUpdate) {
    return !!payload.callback_query?.message?.reply_to_message?.text; // TODO make more reliable
  }

  async handle(payload: TelegramUpdate) {
    const chatId = defined(payload.callback_query?.message?.chat.id, 'callback_query.message.chat.id');
    try {
      const data = parse(payload.callback_query?.data ?? '');
      const ctx: CallbackContext = {
        ...data,
        initiatorId: defined(payload.callback_query?.from.id, 'callback_query.from.id'),
        callbackQueryId: defined(payload.callback_query?.id, 'callback_query.id'),
        chatId,
        messageId: defined(payload.callback_query?.message?.message_id, 'callback_query.message.message_id'),
        replyToId: defined(payload.callback_query?.message?.reply_to_message?.message_id, 'callback_query.message.reply_to_message.message_id'),
        caption: mention(defined(payload.callback_query?.from, 'callback_query.from')),
        text: payload.callback_query?.message?.text ?? '',
        replyToText: defined(payload.callback_query?.message?.reply_to_message?.text, 'callback_query.message.reply_to_message.text'),
        replyToThisBot: false, // callback buttons are always on bot messages and bot does not reply to itself
      };

      switch (data.callback) {
        case ResponseCallbackType.Delete: {
          await this.deleteResponse(ctx);
          break;
        }
        case ResponseCallbackType.Retry: {
          await this.retry(ctx);
          break;
        }
        case ResponseCallbackType.More: {
          await this.removeKeyboard(ctx.chatId, ctx.messageId);
          await this.loadMore(ctx);
          break;
        }
        default: {
          throw new Error(`Unknown callback ${ctx.callback}`);
        }
      }
    } catch (err) {
      await this.reportError(err, { chatId });
    }
  }

  private async deleteResponse(ctx: CallbackContext): Promise<boolean> {
    if (ctx.initiatorId !== ctx.ownerId) {
      await this.api.answerCallbackQuery({
        callback_query_id: ctx.callbackQueryId,
        text: 'иди нахуй, пидор',
        show_alert: true,
      });
      return false;
    }
    await this.api.deleteMessage({ chat_id: ctx.chatId, message_id: ctx.messageId });
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
    const Plugin = plugins.find((x) => x.name === plugin);
    if (!Plugin) {
      throw new Error(`Unknown plugin ${plugin}`);
    }
    return await new Plugin(ctx, this.api, this.env).run({ resultNumber: defined(resultNumber) });
  }
}

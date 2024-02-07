import type { Update, User } from 'node-telegram-bot-api';

import { parse } from '../utils/callback-data';
import { Bot } from './bot';
import { TelegramApi } from './telegram-api';

import type { Env } from '../env';

function mention(user: User): string {
  return user.username ? `@${user.username}` : user.first_name;
}

export async function processTelegramPayload(payload: Update, env: Env) {
  const tg = new TelegramApi(env.TG_TOKEN);
  if (payload?.message?.text) {
    await new Bot({
      tg,
      env,
      chatId: payload.message.chat.id,
      messageId: payload.message.message_id,
      replyTo: payload.message.reply_to_message?.message_id ?? payload.message.message_id,
      originText: payload.message.reply_to_message?.text ?? '',
    }).parseMessageAndRespond({
      text: payload.message.text,
    });
  } else if (payload.callback_query?.message?.reply_to_message?.text) {
    try {
      await tg.editMessageReplyMarkup({
        chat_id: payload.callback_query.message.chat.id,
        message_id: payload.callback_query.message.message_id,
        reply_markup: undefined,
      });
    } catch (err) {
      console.error(err);
    }
    const callbackData = parse(payload.callback_query.data ?? '');
    await new Bot({
      tg,
      env,
      chatId: payload.callback_query.message?.chat.id,
      messageId: payload.callback_query.message.message_id,
      originText: payload.callback_query.message?.reply_to_message.text,
      replyTo: payload.callback_query.message?.reply_to_message?.message_id,
      caption: mention(payload.callback_query.from),
    }).answerCallback({
      ...callbackData,
    });
  } else {
    console.error('Unsupported update', payload);
  }
}

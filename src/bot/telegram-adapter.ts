import type { Update, User } from 'node-telegram-bot-api';

import { parseAndRespond } from './bot';
import { TelegramApi } from './telegram-api';

import type { Env } from '../env';
import { parse } from '../utils/callback-data';

function mention(user: User): string {
  return user.username ? `@${user.username}` : user.first_name;
}

export async function processTelegramPayload(payload: Update, env: Env) {
  if (payload?.message?.text) {
    await parseAndRespond({
      env,
      text: payload.message.text,
      chatId: payload.message.chat.id,
      replyTo: payload.message.reply_to_message?.message_id ?? payload.message.message_id,
      replyToText: payload.message.reply_to_message?.text,
      resultNumber: 0,
    });
  } else if (payload.callback_query?.message?.reply_to_message?.text) {
    try {
      await new TelegramApi(env.TG_TOKEN).editMessageReplyMarkup({
        chat_id: payload.callback_query.message.chat.id,
        message_id: payload.callback_query.message.message_id,
        reply_markup: undefined,
      });
    } catch (err) {
      console.error(err);
    }
    const callbackData = parse(payload.callback_query.data ?? '');
    await parseAndRespond({
      env,
      text: payload.callback_query.message?.reply_to_message?.text,
      chatId: payload.callback_query.message?.chat.id,
      replyTo: payload.callback_query.message?.reply_to_message?.message_id,
      caption: mention(payload.callback_query.from),
      resultNumber: callbackData.resultNumber,
      type: callbackData.type,
    });
  } else {
    console.error('Unsupported update', payload);
  }
}


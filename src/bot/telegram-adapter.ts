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
  if (payload?.message?.text && payload.message.from) {
    await new Bot({
      tg,
      env,
      chatId: payload.message.chat.id,
      messageId: payload.message.message_id,
      originMessageId: payload.message.reply_to_message?.message_id ?? null,
      originText: payload.message.reply_to_message?.text ?? null,
      ownerId: payload.message.from?.id,
    }).parseMessageAndRespond({
      text: payload.message.text,
    });
  } else if (
    payload.callback_query?.message?.reply_to_message?.text &&
    payload.callback_query?.message?.reply_to_message?.from
  ) {
    const callbackData = parse(payload.callback_query.data ?? '');
    await new Bot({
      tg,
      env,
      chatId: payload.callback_query.message?.chat.id,
      messageId: payload.callback_query.message.message_id,
      originMessageId: payload.callback_query.message?.reply_to_message.message_id,
      originText: payload.callback_query.message?.reply_to_message.text,
      caption: mention(payload.callback_query.from),
      ownerId: payload.callback_query.message.reply_to_message.from?.id,
    }).answerCallback({
      ...callbackData,
      callbackQueryId: payload.callback_query.id,
      initiatorId: payload.callback_query.from.id,
    });
  } else {
    console.error('Unsupported update', payload);
  }
}

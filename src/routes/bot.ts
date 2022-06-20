import type { Update, User } from 'node-telegram-bot-api';
import { parseAndRespond, TelegramApi } from '../bot';
import { Env } from '../env';

function mention(user: User): string {
  return user.username ? `@${user.username}` : user.first_name;
}

export async function bot(request: Request, env: Env): Promise<Response> {
  const payload: Update = await request.json();
  if (payload?.message?.text) {
    await parseAndRespond({
      env,
      text: payload.message.text,
      chatId: payload.message.chat.id,
      replyTo: payload.message.message_id,
      resultNum: 0,
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
    await parseAndRespond({
      env,
      text: payload.callback_query.message?.reply_to_message?.text,
      chatId: payload.callback_query.message?.chat.id,
      replyTo: payload.callback_query.message?.reply_to_message?.message_id,
      caption: mention(payload.callback_query.from),
      resultNum: Number(payload.callback_query.data),
    });
  } else {
    console.error('Unsupported update', payload);
  }
  return new Response(null, { status: 204 });
}

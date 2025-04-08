import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import {
  CopyStickerPackContinueHandler,
  CopyStickerPackHandler,
  TelegramCallbackHandler,
  TelegramTextHandler,
  TelegramUpdateHandlerDerived,
  TestHandler,
  AiHandler,
  BusinessChatHandler,
} from '../bot/handlers';
import { TelegramApi } from '../bot/telegram-api';

const handlers: TelegramUpdateHandlerDerived[] = [
  TestHandler,
  AiHandler,
  TelegramTextHandler,
  TelegramCallbackHandler,
  CopyStickerPackHandler,
  CopyStickerPackContinueHandler,
  BusinessChatHandler,
];

export async function onTelegramUpdate(request: Request, env: Env): Promise<Response> {
  const payload = await request.json<TelegramUpdate>();
  const api = new TelegramApi(env.TG_TOKEN);

  for (const Handler of handlers) {
    const handler = new Handler(api, env);
    if (await handler.match(payload)) {
      await handler.handle(payload);
      return new Response(null, { status: 204 });
    }
  }

  console.debug('Unsupported update', payload);
  return new Response(null, { status: 204 });
}

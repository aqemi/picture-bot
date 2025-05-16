import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import {
  AiHandler,
  BusinessChatHandler,
  CopyStickerPackContinueHandler,
  CopyStickerPackHandler,
  StoreGifHandler,
  TelegramCallbackHandler,
  TelegramTextHandler,
  TelegramUpdateHandlerDerived,
} from '../bot/handlers';
import { ResponseHelper } from '../bot/response-helper';
import { TelegramApi } from '../bot/telegram-api';

const handlers: TelegramUpdateHandlerDerived[] = [
  BusinessChatHandler,
  AiHandler,
  TelegramTextHandler,
  TelegramCallbackHandler,
  CopyStickerPackHandler,
  CopyStickerPackContinueHandler,
  StoreGifHandler,
];

export async function onTelegramUpdate(request: Request, env: Env): Promise<Response> {
  const payload = await request.json<TelegramUpdate>();
  const api = new TelegramApi(env.TG_TOKEN);
  const responseHelper = new ResponseHelper(api, env);

  for (const Handler of handlers) {
    const handler = new Handler(api, env, responseHelper);
    if (await handler.match(payload)) {
      await handler.handle(payload);
      console.debug('Incoming message', payload);
      return new Response(null, { status: 204 });
    }
  }
  console.debug('Unsupported message', payload);
  return new Response(null, { status: 204 });
}

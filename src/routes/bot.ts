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
  TestHandler,
} from '../bot/handlers';
import { ResponseHelper } from '../bot/response-helper';
import { TelegramApi } from '../bot/telegram-api';

const handlers: TelegramUpdateHandlerDerived[] = [
  TestHandler,
  AiHandler,
  TelegramTextHandler,
  TelegramCallbackHandler,
  CopyStickerPackHandler,
  CopyStickerPackContinueHandler,
  BusinessChatHandler,
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
      return new Response(null, { status: 204 });
    }
  }

  console.debug('Unsupported update', payload);
  return new Response(null, { status: 204 });
}

import { TelegramApi } from '../bot/telegram-api';
import { PromptManager } from '../managers/prompt.manager';
import { StickerManager } from '../managers/sticker.manager';
import { getBotEndpoint } from '../utils';

async function registerTelegramWebhook(api: TelegramApi, env: Env, host: string) {
  return await api.setWebhook({
    url: `https://${host}${getBotEndpoint(env)}`,
    allowed_updates: ['message', 'callback_query', 'business_message', 'edited_business_message'],
    drop_pending_updates: true,
  });
}

export async function install(req: Request, env: Env): Promise<Response> {
  const { host } = new URL(req.url);
  const api = new TelegramApi(env.TG_TOKEN);
  const setWebhookResponse = await registerTelegramWebhook(api, env, host);

  const stickersPrompt = await new StickerManager(api, env).getPrompt();
  await new PromptManager(env).updateSystemPrompt('sticker', stickersPrompt);

  return new Response(
    JSON.stringify({
      setWebhook: setWebhookResponse,
      getWebhookInfo: await api.getWebhookInfo(),
      stickersPrompt,
    }),
  );
}

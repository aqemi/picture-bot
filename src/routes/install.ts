import { TelegramApi } from '../bot/telegram-api';
import { Env } from '../env';
import { botEndpoint } from '../utils';

export async function install(req: Request, env: Env): Promise<Response> {
  const { host } = new URL(req.url);
  const api = new TelegramApi(env.TG_TOKEN);
  const setWebhookResponse = await api.setWebhook({
    url: `https://${host}${botEndpoint(env.TG_TOKEN)}`,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
  return new Response(
    JSON.stringify({
      setWebhook: setWebhookResponse,
      getWebhookInfo: await api.getWebhookInfo(),
    }),
  );
}

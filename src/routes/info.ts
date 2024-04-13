import { TelegramApi } from '../bot/telegram-api';
import { Env } from '../env';

export async function info(req: Request, env: Env): Promise<Response> {
  const api = new TelegramApi(env.TG_TOKEN);
  return new Response(
    JSON.stringify({
      getWebhookInfo: await api.getWebhookInfo(),
      getMe: await api.getMe(),
    }),
  );
}

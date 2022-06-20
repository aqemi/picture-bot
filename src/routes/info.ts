import { TelegramApi } from '../bot';
import { Env } from '../env';

export async function info(req: Request, env: Env): Promise<Response> {
  const api = new TelegramApi(env.TG_TOKEN);
  return api.getWebhookInfo();
}

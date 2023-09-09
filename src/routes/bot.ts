import type { Update } from 'node-telegram-bot-api';
import { processTelegramPayload } from '../bot/telegram-adapter';
import { Env } from '../env';

export async function onTelegramUpdate(request: Request, env: Env): Promise<Response> {
  const payload = await request.json<Update>();
  await processTelegramPayload(payload, env);
  return new Response(null, { status: 204 });
}

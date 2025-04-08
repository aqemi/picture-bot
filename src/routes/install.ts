import { TelegramApi } from '../bot/telegram-api';
import { botEndpoint } from '../utils';
import { getStickerSets } from '../utils/sticketsets';

async function registerTelegramWebhook(api: TelegramApi, env: Env, host: string) {
  return await api.setWebhook({
    url: `https://${host}${botEndpoint(env.TG_TOKEN)}`,
    allowed_updates: ['message', 'callback_query', 'business_message', 'edited_business_message'],
    drop_pending_updates: true,
  });
}

async function getStickerPackPrompt(api: TelegramApi, env: Env): Promise<string> {
  const stickerpacks = await Promise.all(getStickerSets(env).map((name) => api.getStickerSet({ name })));
  const packPrompts = stickerpacks.map(
    ({ result: pack }) => `${pack.title} (${pack.name})\n${pack.stickers.map((s) => s.emoji).join()}`,
  );
  const prompt = `Доступные стикеры:\n\n${packPrompts.join('\n\n')}`;
  return prompt;
}

async function updateStickerPrompt(prompt: string, env: Env): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO prompts (id, role, content) VALUES (?1, ?2, ?3) ON CONFLICT DO UPDATE SET content = ?3',
  )
    .bind('sticker', 'system', prompt)
    .run();
}

export async function install(req: Request, env: Env): Promise<Response> {
  const { host } = new URL(req.url);
  const api = new TelegramApi(env.TG_TOKEN);
  const setWebhookResponse = await registerTelegramWebhook(api, env, host);

  const stickerPrompt = await getStickerPackPrompt(api, env);
  await updateStickerPrompt(stickerPrompt, env);

  return new Response(
    JSON.stringify({ setWebhook: setWebhookResponse, getWebhookInfo: await api.getWebhookInfo(), stickerPrompt }),
  );
}

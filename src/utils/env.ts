export function getBotEndpoint(env: Env) {
  return `/bot_${env.TG_TOKEN}`;
}

export function getBotUsername(env: Env) {
  return `${env.BOT_USERNAME}_bot`;
}

export function getBotMentionTag(env: Env) {
  return `@${getBotUsername(env)}`;
}

export function getSanitizeRegex(env: Env): RegExp {
  const pattern = Object.values(env)
    .filter((x) => typeof x === 'string')
    .join('|');
  return new RegExp(pattern, 'g');
}

export function getEnabledStickerSets(env: Env): string[] {
  if (!env.STICKER_SETS) {
    return [];
  }
  return env.STICKER_SETS.split(',').map((x) => x.trim()) ?? [];
}

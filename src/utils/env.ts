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

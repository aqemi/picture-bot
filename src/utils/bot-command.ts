export const getBotCommandRegex = (cmd: string, botUsername: string) =>
  new RegExp(`^(\\/${cmd}|\\/${cmd}@${botUsername}_bot)$`);

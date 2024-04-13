import type { User } from 'node-telegram-bot-api';

export function mention(user: User): string {
  return user.username ? `@${user.username}` : user.first_name;
}

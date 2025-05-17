import { Update } from 'node-telegram-bot-api';
import { LogManager } from '../../managers/log.manager';
import { TelegramUpdateHandler } from './base.handler';
import { AiMessageInterpreter } from './ai-message-interpreter';

export class LogHandler extends TelegramUpdateHandler {
  public readonly passThrough = true;
  public async match({ message }: Update): Promise<boolean> {
    return message?.chat.type === 'supergroup';
  }
  public async handle({ message }: Update): Promise<void> {
    try {
      if (!message) {
        throw new Error('No message provided to LogHandler');
      }
      const log = new LogManager(this.env);
      const interpeter = new AiMessageInterpreter(this.env, this.api);
      const username = interpeter.getFullname(message);
      await log.add(message.chat.id, message.message_id, message.date, username);
    } catch (error) {
      console.error('Error in LogHandler', error);
    }
  }
}

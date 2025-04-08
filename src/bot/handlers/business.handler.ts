import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { AiHandler } from './ai.handler';

export class BusinessChatHandler extends AiHandler {
  async match(payload: TelegramUpdate) {
    const message = payload.business_message ?? payload.edited_business_message;
    return !!message && message.from?.id === message.chat?.id;
  }

  async handle(payload: TelegramUpdate) {
    const message = payload.business_message ?? payload.edited_business_message;
    try {
      await this.handleMessage(defined(message, 'business_message'));
    } catch (error) {
      console.error('Error handling business message', error);
    }
  }
}

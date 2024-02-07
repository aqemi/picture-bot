import type {
  AnswerCallbackQueryOptions,
  ChatId,
  EditMessageReplyMarkupOptions,
  InlineKeyboardMarkup,
  SendAnimationOptions,
  SendMessageOptions,
  SendPhotoOptions,
  SetWebHookOptions,
  
} from 'node-telegram-bot-api';
import { throwOnFetchError } from '../utils';

interface ApiSendMessageOptions extends SendMessageOptions {
  chat_id: ChatId;
  text: string;
}

interface ApiSetWebHookOptions extends SetWebHookOptions {
  certificate?: any;
  drop_pending_updates?: true;
}

interface ApiSendPhotoOptions extends SendPhotoOptions {
  chat_id: ChatId;
  photo: string;
}

interface ApiSendAnimationOptions extends SendAnimationOptions {
  chat_id: ChatId;
  animation: string;
}

interface ApiEditMessageReplyMarkupOptions extends EditMessageReplyMarkupOptions {
  reply_markup?: InlineKeyboardMarkup;
}

interface ApiDeleteMessage {
  chat_id: ChatId;
  message_id: number;
}

interface ApiAnswerCallbackQuery extends AnswerCallbackQueryOptions {

}

export class TelegramApi {
  constructor(private readonly token: string) {}
  private async makeRequest(method: string, payload: object) {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    await throwOnFetchError(response);
    return response;
  }

  public async setWebhook(options: ApiSetWebHookOptions) {
    return this.makeRequest('setWebhook', options);
  }

  public async sendMessage(options: ApiSendMessageOptions) {
    return this.makeRequest('sendMessage', options);
  }

  public async sendPhoto(options: ApiSendPhotoOptions) {
    return this.makeRequest('sendPhoto', options);
  }

  public async sendAnimation(options: ApiSendAnimationOptions) {
    return this.makeRequest('sendAnimation', options);
  }

  public async editMessageReplyMarkup(options: ApiEditMessageReplyMarkupOptions) {
    return this.makeRequest('editMessageReplyMarkup', options);
  }

  public async getWebhookInfo() {
    return this.makeRequest('getWebhookInfo', {});
  }

  public async deleteMessage(options: ApiDeleteMessage) {
    return this.makeRequest('deleteMessage', options);
  }

  public async answerCallbackQuery(options: ApiAnswerCallbackQuery) {
    return this.makeRequest('answerCallbackQuery', options);
  }
}

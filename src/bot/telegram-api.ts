import type {
  AnswerCallbackQueryOptions,
  EditMessageReplyMarkupOptions,
  InlineKeyboardMarkup,
  MaskPosition,
  SendAnimationOptions,
  SendMessageOptions,
  SendPhotoOptions,
  SetWebHookOptions,
  StickerSet,
  User,
  WebhookInfo,
} from 'node-telegram-bot-api';
import { throwOnFetchError } from '../utils';

interface ApiResponse<T> {
  ok: boolean;
  description?: string;
  error_code?: number;
  result: T;
}

interface ApiSendMessageOptions extends SendMessageOptions {
  chat_id: number;
  text: string;
}

interface ApiSetWebHookOptions extends SetWebHookOptions {
  certificate?: any;
  drop_pending_updates?: true;
}

interface ApiSendPhotoOptions extends SendPhotoOptions {
  chat_id: number;
  photo: string;
}

interface ApiSendAnimationOptions extends SendAnimationOptions {
  chat_id: number;
  animation: string;
}

interface ApiEditMessageReplyMarkupOptions extends EditMessageReplyMarkupOptions {
  reply_markup?: InlineKeyboardMarkup;
}

interface ApiDeleteMessage {
  chat_id: number;
  message_id: number;
}

interface ApiAnswerCallbackQuery extends AnswerCallbackQueryOptions {}

export interface InputSticker {
  sticker: string;
  format: 'static' | 'animated' | 'video';
  emoji_list: string[];
  maskPosition?: MaskPosition;
  keywords?: string[];
}

interface ApiCreateStickerSetOptions {
  user_id: number;
  name: string;
  title: string;
  stickers: InputSticker[];
  sticker_type?: 'regular' | 'mask' | 'custom_emoji';
  needs_repainting?: boolean;
}

interface ApiGetStickerSetOptions {
  name: string;
}

interface ApiDeleteStickerSetOptions {
  name: string;
  force?: true;
}

interface AddStickerToSetOptions {
  user_id: number;
  name: string;
  sticker: InputSticker;
}

export class TelegramApi {
  constructor(private readonly token: string) {}
  private async makeRequest(method: string, payload: object, { passError = false }: { passError?: boolean } = {}) {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!passError) {
      await throwOnFetchError(response);
    }
    return response;
  }

  public async getMe(): Promise<User> {
    const response = await this.makeRequest('getMe', {});
    const { result } = await response.json<ApiResponse<User>>();
    return result;
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

  public async getWebhookInfo(): Promise<WebhookInfo> {
    const response = await this.makeRequest('getWebhookInfo', {});
    const { result } = await response.json<ApiResponse<WebhookInfo>>();
    return result;
  }

  public async deleteMessage(options: ApiDeleteMessage) {
    return this.makeRequest('deleteMessage', options);
  }

  public async answerCallbackQuery(options: ApiAnswerCallbackQuery) {
    return this.makeRequest('answerCallbackQuery', options);
  }

  public async createNewStickerSet(options: ApiCreateStickerSetOptions) {
    return this.makeRequest('createNewStickerSet', options);
  }

  public async getStickerSet(options: ApiGetStickerSetOptions): Promise<StickerSet> {
    const response = await this.makeRequest('getStickerSet', options);
    const { result } = await response.json<ApiResponse<StickerSet>>();
    return result;
  }

  public async deleteStickerSet(options: ApiDeleteStickerSetOptions) {
    const { force, ...apiOptions } = options;
    const response = await this.makeRequest('deleteStickerSet', apiOptions, { passError: force });
    if (!response.ok) {
      const json = await response.json<ApiResponse<true>>();
      if (json.error_code !== 400) {
        throw new Error(
          `${response.url.replace(/\/bot.+\//g, '/***/')} - ${response.statusText}: ${JSON.stringify(json, null, 2)}`,
        );
      }
    }
  }

  public async addStickerToSet(options: AddStickerToSetOptions) {
    return this.makeRequest('addStickerToSet', options);
  }
}

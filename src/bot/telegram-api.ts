import type {
  AnswerCallbackQueryOptions,
  File,
  InlineKeyboardMarkup,
  MaskPosition,
  StickerSet,
  EditMessageReplyMarkupOptions as TelegramEditMessageReplyMarkupOptions,
  SendAnimationOptions as TelegramSendAnimationOptions,
  SendMessageOptions as TelegramSendMessageOptions,
  SendPhotoOptions as TelegramSendPhotoOptions,
  SetWebHookOptions as TelegramSetWebHookOptions,
  User,
  WebhookInfo,
} from 'node-telegram-bot-api';
import { FetchError, defined, throwOnFetchError } from '../utils';

interface TelegramResponse<T> {
  ok: boolean;
  description?: string;
  error_code?: number;
  result: T;
}

interface SendMessageOptions extends TelegramSendMessageOptions {
  chat_id: number;
  text: string;
}

interface SetWebHookOptions extends TelegramSetWebHookOptions {
  drop_pending_updates?: true;
}

interface SendPhotoOptions extends TelegramSendPhotoOptions {
  chat_id: number;
  photo: string;
}

interface SendAnimationOptions extends TelegramSendAnimationOptions {
  chat_id: number;
  animation: string;
}

interface EditMessageReplyMarkupOptions extends TelegramEditMessageReplyMarkupOptions {
  reply_markup?: InlineKeyboardMarkup;
}

interface DeleteMessage {
  chat_id: number;
  message_id: number;
}

export interface InputSticker {
  sticker: string;
  format: 'static' | 'animated' | 'video';
  emoji_list: string[];
  maskPosition?: MaskPosition;
  keywords?: string[];
}

interface CreateStickerSetOptions {
  user_id: number;
  name: string;
  title: string;
  stickers: InputSticker[];
  sticker_type?: 'regular' | 'mask' | 'custom_emoji';
  needs_repainting?: boolean;
}

interface GetStickerSetOptions {
  name: string;
}

interface DeleteStickerSetOptions {
  name: string;
  force?: true;
}

interface AddStickerToSetOptions {
  user_id: number;
  name: string;
  sticker: InputSticker;
}

interface GetFileOptions {
  file_id: string;
}

interface SetStickerSetThumbnailOptions {
  name: string;
  user_id: number;
  thumbnail: Blob;
  format: 'static' | 'animated' | 'video';
}

interface GetFileBlobOptions {
  file_id: string;
  token: string;
}

export class TelegramApi {
  constructor(private readonly token: string) {}
  private async makeRequest<T = true>(method: string, payload: object): Promise<TelegramResponse<T>> {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    await throwOnFetchError(response);
    return await response.json<TelegramResponse<T>>();
  }

  public async getMe() {
    return await this.makeRequest<User>('getMe', {});
  }

  public async setWebhook(options: SetWebHookOptions) {
    return this.makeRequest('setWebhook', options);
  }

  public async sendMessage(options: SendMessageOptions) {
    return this.makeRequest('sendMessage', options);
  }

  public async sendPhoto(options: SendPhotoOptions) {
    return this.makeRequest('sendPhoto', options);
  }

  public async sendAnimation(options: SendAnimationOptions) {
    return this.makeRequest('sendAnimation', options);
  }

  public async editMessageReplyMarkup(options: EditMessageReplyMarkupOptions) {
    return this.makeRequest('editMessageReplyMarkup', options);
  }

  public async getWebhookInfo() {
    return await this.makeRequest<WebhookInfo>('getWebhookInfo', {});
  }

  public async deleteMessage(options: DeleteMessage) {
    return this.makeRequest('deleteMessage', options);
  }

  public async answerCallbackQuery(options: AnswerCallbackQueryOptions) {
    return this.makeRequest('answerCallbackQuery', options);
  }

  public async createNewStickerSet(options: CreateStickerSetOptions) {
    return this.makeRequest('createNewStickerSet', options);
  }

  public async getStickerSet(options: GetStickerSetOptions) {
    return await this.makeRequest<StickerSet>('getStickerSet', options);
  }

  public async deleteStickerSet(options: DeleteStickerSetOptions) {
    const { force, ...apiOptions } = options;
    try {
      return await this.makeRequest('deleteStickerSet', apiOptions);
    } catch (err) {
      if (force && err instanceof FetchError && err.code === 400) {
        return;
      } else {
        throw err;
      }
    }
  }

  public async addStickerToSet(options: AddStickerToSetOptions) {
    return this.makeRequest('addStickerToSet', options);
  }

  public async setStickerSetThumbnail(options: SetStickerSetThumbnailOptions) {
    const formdata = new FormData();
    Object.entries(options).forEach(([key, value]) => {
      formdata.set(key, value);
    });

    const response = await fetch(`https://api.telegram.org/bot${this.token}/setStickerSetThumbnail`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formdata,
    });
    await throwOnFetchError(response);
    return await response.json<TelegramResponse<true>>();
  }

  public async getFile(options: GetFileOptions) {
    return this.makeRequest<File>('getFile', options);
  }

  public async getFileUrl(file: File): Promise<string> {
    const filepath = defined(file.file_path, 'file_path');
    return `https://api.telegram.org/file/bot${this.token}/${filepath}`;
  }

  public async getFileBlob({ file_id }: GetFileBlobOptions): Promise<Blob> {
    const { result: file } = await this.getFile({ file_id });
    const fileurl = await this.getFileUrl(file);
    const response = await fetch(fileurl);
    await throwOnFetchError(response);
    return await response.blob();
  }
}

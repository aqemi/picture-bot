import type * as Telegram from 'node-telegram-bot-api';
import { FetchError, defined, throwOnFetchError } from '../utils';

type TelegramResponse<T> = {
  ok: boolean;
  description?: string;
  error_code?: number;
  result: T;
};

type SendMessageOptions = Telegram.SendMessageOptions & {
  chat_id: number;
  text: string;
};

type SetWebHookOptions = Telegram.SetWebHookOptions & {
  drop_pending_updates?: true;
};

type SendPhotoOptions = Telegram.SendPhotoOptions & {
  chat_id: number;
  photo: string;
};

type SendStickerOptions = Telegram.SendStickerOptions & {
  chat_id: number;
  sticker: string;
};

type SendAnimationOptions = Telegram.SendAnimationOptions & {
  chat_id: number;
  animation: string;
};

type EditMessageReplyMarkupOptions = Telegram.EditMessageReplyMarkupOptions & {
  reply_markup?: Telegram.InlineKeyboardMarkup;
};

type DeleteMessage = {
  chat_id: number;
  message_id: number;
};

export type InputSticker = {
  sticker: string;
  format: 'static' | 'animated' | 'video';
  emoji_list: string[];
  maskPosition?: Telegram.MaskPosition;
  keywords?: string[];
};

type CreateStickerSetOptions = {
  user_id: number;
  name: string;
  title: string;
  stickers: InputSticker[];
  sticker_type?: 'regular' | 'mask' | 'custom_emoji';
  needs_repainting?: boolean;
};

type GetStickerSetOptions = {
  name: string;
};

type DeleteStickerSetOptions = {
  name: string;
  force?: true;
};

type AddStickerToSetOptions = {
  user_id: number;
  name: string;
  sticker: InputSticker;
};

type GetFileOptions = {
  file_id: string;
};

type SetStickerSetThumbnailOptions = {
  name: string;
  user_id: number;
  thumbnail: Blob;
  format: 'static' | 'animated' | 'video';
};

type GetFileBlobOptions = {
  file_id: string;
  token: string;
};

type ReactionTypeEmoji = {
  type: 'emoji';
  emoji: string;
};

type ReactionType = ReactionTypeEmoji;

type SetMessageReactionOptions = {
  chat_id: number;
  message_id: number;
  reaction: ReactionType[];
  is_big?: boolean;
};

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
    return await this.makeRequest<Telegram.User>('getMe', {});
  }

  public async setWebhook(options: SetWebHookOptions) {
    return this.makeRequest('setWebhook', options);
  }

  public async sendMessage(options: SendMessageOptions) {
    return this.makeRequest<Telegram.Message>('sendMessage', options);
  }

  public async setMessageReaction(options: SetMessageReactionOptions) {
    return this.makeRequest<Telegram.Message>('setMessageReaction', options);
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
    return await this.makeRequest<Telegram.WebhookInfo>('getWebhookInfo', {});
  }

  public async deleteMessage(options: DeleteMessage) {
    return this.makeRequest('deleteMessage', options);
  }

  public async answerCallbackQuery(options: Telegram.AnswerCallbackQueryOptions) {
    return this.makeRequest('answerCallbackQuery', options);
  }

  public async createNewStickerSet(options: CreateStickerSetOptions) {
    return this.makeRequest('createNewStickerSet', options);
  }

  public async getStickerSet(options: GetStickerSetOptions) {
    return await this.makeRequest<Telegram.StickerSet>('getStickerSet', options);
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

  public async sendSticker(options: SendStickerOptions) {
    return this.makeRequest('sendSticker', options);
  }

  public async setStickerSetThumbnail(options: SetStickerSetThumbnailOptions) {
    const formdata = new FormData();
    Object.entries(options).forEach(([key, value]) => {
      formdata.set(key, value as string);
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
    return this.makeRequest<Telegram.File>('getFile', options);
  }

  public async getFileUrl(file: Telegram.File): Promise<string> {
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

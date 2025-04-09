import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { FetchError, defined } from '../../utils';
import { CopyStickerPackHandler } from './copy-sticker-pack.handler';

export class CopyStickerPackContinueHandler extends CopyStickerPackHandler {
  async match(payload: TelegramUpdate) {
    const { callback_query } = payload;
    return !!callback_query?.message?.reply_to_message?.sticker && callback_query.message.chat.type === 'private';
  }

  async handle(payload: TelegramUpdate) {
    const { callback_query } = payload;
    const { message } = callback_query ?? {};
    const chatId = defined(message?.chat.id, 'chatId');
    const messageId = defined(message?.message_id, 'message_id');

    try {
      await this.responseHelper.removeKeyboard(chatId, messageId);
      const originalStickerSetName = defined(
        message?.reply_to_message?.sticker?.set_name,
        'reply_to_message?.sticker?.set_name',
      );
      const stickerSetCopyName = defined(callback_query?.data, 'callback_query?.data');
      const userId = defined(message?.reply_to_message?.from?.id, 'reply_to_message?.from?.id');
      const repliedMessageId = defined(message?.reply_to_message?.message_id, 'reply_to_message?.message_id');

      const { result: originalStickerSet } = await this.api.getStickerSet({ name: originalStickerSetName });
      const { result: stickerSetCopy } = await this.api.getStickerSet({ name: stickerSetCopyName });

      if (originalStickerSet.thumb && !stickerSetCopy.thumb) {
        const blob = await this.api.getFileBlob({
          file_id: originalStickerSet.thumb?.file_id,
          token: this.env.TG_TOKEN,
        });
        await this.api.setStickerSetThumbnail({
          name: stickerSetCopyName,
          user_id: userId,
          thumbnail: blob,
          format: this.getFormat(originalStickerSet),
        });
      }

      const remaining = originalStickerSet.stickers.slice(stickerSetCopy.stickers.length);
      let added = stickerSetCopy.stickers.length;
      for (const sticker of remaining) {
        console.info(`Adding ${++added} out of ${originalStickerSet.stickers.length}`);
        await this.api.addStickerToSet({
          user_id: userId,
          name: stickerSetCopyName,
          sticker: this.remapSticker(sticker),
        });
      }

      await this.sendComplete(stickerSetCopyName, chatId, repliedMessageId);
    } catch (error) {
      if (error instanceof FetchError && error.code === 429) {
        throw error;
      } else {
        await this.responseHelper.sendError(chatId, error);
      }
    }
  }
}

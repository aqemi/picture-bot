import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { FetchError, defined } from '../../utils';
import { CopyStickerPackHandler } from './copy-sticker-pack.handler';

export class CopyStickerPackContinueHandler extends CopyStickerPackHandler {
  match(payload: TelegramUpdate) {
    return (
      !!payload.callback_query?.message?.reply_to_message?.sticker &&
      payload.callback_query.message.chat.id === payload.callback_query.from.id
    );
  }

  async handle(payload: TelegramUpdate) {
    const chatId = defined(payload.callback_query?.message?.chat.id, 'chatId');
    const messageId = defined(payload.callback_query?.message?.message_id, 'message_id');

    try {
      await this.removeKeyboard(chatId, messageId);
      const originalStickerSetName = defined(
        payload.callback_query?.message?.reply_to_message?.sticker?.set_name,
        'reply_to_message?.sticker?.set_name',
      );
      const userId = defined(payload.callback_query?.message?.reply_to_message?.from?.id, 'reply_to_message?.from?.id');
      const repliedMessageId = defined(
        payload.callback_query?.message?.reply_to_message?.message_id,
        'reply_to_message?.message_id',
      );

      const { result: originalStickerSet } = await this.api.getStickerSet({ name: originalStickerSetName });
      const stickerSetCopyName = await this.getCopyName(originalStickerSetName);
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
    } catch (err) {
      if (err instanceof FetchError && err.code === 429) {
        throw err;
      } else {
        await this.reportError(err, { chatId });
      }
    }
  }
}

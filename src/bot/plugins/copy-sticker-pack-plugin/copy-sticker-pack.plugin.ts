import type { Sticker } from 'node-telegram-bot-api';
import type { InputSticker, TelegramApi } from '../../telegram-api';
import { throwOnFetchError } from '../../../utils';

type CopyStickerPackParams = {
  stickerSetName?: string;
  chatId: number;
  userId: number;
  messageId: number;
};

type CompleteStickerPackParams = {
  chatId: number;
  userId: number;
  originalStickerSetName?: string;
  originMessageId: number;
};

const MAX_INITIAL_STICKERS = 50;

export class CopyStickerPackPlugin {
  constructor(private readonly api: TelegramApi) {}

  public async copyStickerPack({ stickerSetName, chatId, userId, messageId }: CopyStickerPackParams) {
    try {
      if (!stickerSetName) {
        throw new Error('No sticker set name');
      }

      const copyStickerSetName = await this.getCopyName(stickerSetName);

      await this.api.deleteStickerSet({ name: copyStickerSetName, force: true });

      const originalStickerSet = await this.api.getStickerSet({ name: stickerSetName });

      await this.api.createNewStickerSet({
        name: copyStickerSetName,
        title: originalStickerSet.title,
        sticker_type: originalStickerSet.sticker_type,
        user_id: userId,
        stickers: originalStickerSet.stickers.slice(0, MAX_INITIAL_STICKERS).map((x) => this.remapSticker(x)),
      });

      if (originalStickerSet.stickers.length > MAX_INITIAL_STICKERS) {
        await this.api.sendMessage({
          chat_id: chatId,
          text: `${MAX_INITIAL_STICKERS} out of ${originalStickerSet.stickers.length} imported. Press continue.`,
          reply_to_message_id: messageId,
          reply_markup: {
            inline_keyboard: [[{ text: 'Continue', callback_data: 'true' }]],
          },
        });
      } else {
        await this.sendComplete(copyStickerSetName, chatId, messageId);
      }
    } catch (err: any) {
      console.error(err);

      await this.api.sendMessage({
        chat_id: chatId,
        text: `\`\`\`${err?.name}: ${err?.message}\`\`\``,
        parse_mode: 'MarkdownV2',
      });
    }
  }

  public async completeStickerPack({
    originalStickerSetName,
    userId,
    chatId,
    originMessageId,
  }: CompleteStickerPackParams) {
    if (!originalStickerSetName) {
      throw new Error('No sticker set name');
    }
    const originalStickerSet = await this.api.getStickerSet({ name: originalStickerSetName });
    const copyStickerSetName = await this.getCopyName(originalStickerSetName);
    const copyStickerSet = await this.api.getStickerSet({ name: copyStickerSetName });

    const remaining = originalStickerSet.stickers.slice(copyStickerSet.stickers.length);
    let added = copyStickerSet.stickers.length;
    for (const sticker of remaining) {
      console.info(`Adding ${++added} of ${originalStickerSet.stickers.length}`);
      await this.api.addStickerToSet({
        user_id: userId,
        name: copyStickerSetName,
        sticker: this.remapSticker(sticker),
      });
    }

    await this.sendComplete(copyStickerSetName, chatId, originMessageId);
  }

  private remapSticker(originalSticker: Sticker): InputSticker {
    return {
      sticker: originalSticker.file_id,
      format: this.getFormat(originalSticker),
      emoji_list: originalSticker.emoji ? [originalSticker.emoji] : [],
      // 'keywords'
    };
  }

  private getFormat(originalSticker: Sticker): InputSticker['format'] {
    return (originalSticker.is_animated && 'animated') || (originalSticker.is_video && 'video') || 'static';
  }

  private async getCopyName(originalName: string): Promise<string> {
    const { username: botUsername } = await this.api.getMe();
    return `${originalName}_by_${botUsername}`;
  }

  private async sendComplete(stickerSetName: string, chatId: number, replyTo: number) {
    await this.api.sendMessage({
      chat_id: chatId,
      text: `Copying finished. https://t.me/addstickers/${stickerSetName}`,
      reply_to_message_id: replyTo,
    });
  }
}

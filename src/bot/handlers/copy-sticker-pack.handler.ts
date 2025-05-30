import type { Sticker, Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { InputSticker } from '../telegram-api';
import { TelegramUpdateHandler } from './base.handler';
import { random } from '../../utils/random';

export class CopyStickerPackHandler extends TelegramUpdateHandler {
  protected readonly MAX_INITIAL_STICKERS = 50;

  async match({ message }: TelegramUpdate) {
    return !!message?.sticker && message?.chat.type === 'private' && message.reply_to_message?.text === '/copysticker';
  }

  async handle(payload: TelegramUpdate) {
    const chatId = defined(payload.message?.chat.id, 'chatId');
    try {
      const stickerSetName = defined(payload.message?.sticker?.set_name, 'stickerSetName');
      const stickerSetCopyName = await this.getCopyName(stickerSetName);
      const userId = defined(payload.message?.from?.id, 'userId');
      const messageId = defined(payload.message?.message_id, 'messageId');

      await this.api.deleteStickerSet({ name: stickerSetCopyName, force: true });

      const { result: stickerSet } = await this.api.getStickerSet({ name: stickerSetName });

      await this.api.createNewStickerSet({
        name: stickerSetCopyName,
        title: this.getCopyTitle(stickerSet.title),
        sticker_type: stickerSet.sticker_type,
        user_id: userId,
        stickers: stickerSet.stickers.slice(0, this.MAX_INITIAL_STICKERS).map((x) => this.remapSticker(x)),
      });

      if (stickerSet.stickers.length > this.MAX_INITIAL_STICKERS) {
        await this.api.sendMessage({
          chat_id: chatId,
          text: `${this.MAX_INITIAL_STICKERS} out of ${stickerSet.stickers.length} imported. Press continue.`,
          reply_to_message_id: messageId,
          reply_markup: {
            inline_keyboard: [[{ text: 'Continue', callback_data: stickerSetCopyName }]],
          },
        });
      } else {
        await this.sendComplete(stickerSetCopyName, chatId, messageId);
      }
    } catch (error) {
      await this.responseHelper.sendError(chatId, error);
    }
  }

  protected remapSticker(sticker: Sticker): InputSticker {
    return {
      sticker: sticker.file_id,
      format: this.getFormat(sticker),
      emoji_list: sticker.emoji ? [sticker.emoji] : [],
    };
  }

  protected getFormat(source: { is_animated: boolean; is_video: boolean }): InputSticker['format'] {
    return (source.is_animated && 'animated') || (source.is_video && 'video') || 'static';
  }

  protected async getCopyName(originalName: string): Promise<string> {
    const {
      result: { username: botUsername },
    } = await this.api.getMe();
    const suffix = `_by_${botUsername}`;

    if (originalName.endsWith(suffix)) {
      return `${originalName.replace(suffix, '')}${random(0, 9)}${suffix}`;
    }

    return `${originalName}${suffix}`;
  }

  private getCopyTitle(originalTitle: string): string {
    return `${originalTitle} ☆`;
  }

  protected async sendComplete(stickerSetName: string, chatId: number, replyTo: number) {
    await this.api.sendMessage({
      chat_id: chatId,
      text: `Copying finished. https://t.me/addstickers/${stickerSetName}`,
      reply_to_message_id: replyTo,
    });
  }
}

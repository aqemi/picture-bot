import { Sticker, StickerSet } from 'node-telegram-bot-api';
import { TelegramApi } from '../bot/telegram-api';

export class StickerManager {
  constructor(
    private readonly api: TelegramApi,
    private readonly env: Env,
  ) {}

  public async getAllStickerSets(): Promise<StickerSet[]> {
    const result = await Promise.all(this.getEnabledStickerSets().map((name) => this.api.getStickerSet({ name })));
    return result.map((x) => x.result);
  }

  public async getPrompt(): Promise<string> {
    const sets = await this.getAllStickerSets();
    const setsPrompts = sets.map((set) => `${set.title} (${set.name}): ${set.stickers.map((s) => s.emoji).join()}`);
    const prompt = `Доступные стикеры:\n${setsPrompts.join('\n')}`;
    return prompt;
  }

  public async getSticker(emoji: string): Promise<Sticker | null> {
    const sets = await this.getAllStickerSets();
    const stickers = await Promise.all(sets.flatMap((x) => x.stickers));
    const matchedStickers = stickers.filter((x) => x.emoji === emoji);
    if (!matchedStickers.length) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * matchedStickers.length);
    return matchedStickers[randomIndex];
  }

  private getEnabledStickerSets(): string[] {
    if (!this.env.STICKER_SETS) {
      return [];
    }
    return this.env.STICKER_SETS.split(',')
      .map((x) => x.trim())
      .filter((x) => x);
  }
}

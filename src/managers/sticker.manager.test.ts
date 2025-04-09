import { Sticker, StickerSet } from 'node-telegram-bot-api';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { TelegramApi } from '../bot/telegram-api';
import { StickerManager } from './sticker.manager';

describe('StickerManager', () => {
  let stickerManager: StickerManager;
  const mockApi = {
    getStickerSet: vi.fn(),
  } as unknown as TelegramApi;

  const mockEnv = {
    STICKER_SETS: 'set1,set2',
  } as Env;

  const mockStickerSets: StickerSet[] = [
    { name: 'set1', title: 'Set 1', stickers: [{ emoji: '😀' } as Sticker] } as StickerSet,
    { name: 'set2', title: 'Set 2', stickers: [{ emoji: '😂' } as Sticker] } as StickerSet,
  ];

  beforeEach(() => {
    (mockApi.getStickerSet as Mock).mockResolvedValueOnce({ result: mockStickerSets[0] });
    (mockApi.getStickerSet as Mock).mockResolvedValueOnce({ result: mockStickerSets[1] });

    stickerManager = new StickerManager(mockApi, mockEnv);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllStickerSets', () => {
    it('should return all sticker sets', async () => {
      const result = await stickerManager.getAllStickerSets();
      expect(result).toEqual(mockStickerSets);
    });
  });

  describe('getPrompt', () => {
    it('should return a formatted prompt with sticker sets and emojis', async () => {
      const result = await stickerManager.getPrompt();
      expect(result).toBe('Доступные стикеры:\nSet 1 (set1): 😀\nSet 2 (set2): 😂');
    });
  });

  describe('getSticker', () => {
    it('should return a random sticker matching the given emoji', async () => {
      const result = await stickerManager.getSticker('😀');
      expect(result).toBeTruthy();
      expect(['😀']).toContain(result?.emoji);
    });

    it('should return null if no stickers match the given emoji', async () => {
      const result = await stickerManager.getSticker('👀');
      expect(result).toBeNull();
    });
  });

  describe('getEnabledStickerSets', () => {
    it('should return an array of sticker sets', async () => {
      const env = { STICKER_SETS: 'set1,set2' } as Env;
      const manager = new StickerManager(mockApi, env);
      const result = await manager.getAllStickerSets();
      expect(result).toEqual(mockStickerSets);
    });

    it('should trim spaces from sticker sets', async () => {
      const env = { STICKER_SETS: ' set1 , set2   ' } as Env;
      const manager = new StickerManager(mockApi, env);
      const result = await manager.getAllStickerSets();
      expect(result).toEqual(mockStickerSets);
    });

    it('should return an empty array if STICKER_SETS is empty', async () => {
      const env = { STICKER_SETS: '' } as Env;
      const manager = new StickerManager(mockApi, env);
      const result = await manager.getAllStickerSets();
      expect(result).toEqual([]);
    });

    it('should handle a single sticker set', async () => {
      const env = { STICKER_SETS: 'set1' } as Env;
      const manager = new StickerManager(mockApi, env);
      const result = await manager.getAllStickerSets();
      expect(result).toEqual([mockStickerSets[0]]);
    });

    it('should handle multiple sticker sets with extra commas', async () => {
      const env = { STICKER_SETS: 'set1,set2' } as Env;
      const manager = new StickerManager(mockApi, env);
      const result = await manager.getAllStickerSets();
      expect(result).toEqual(mockStickerSets);
    });
  });
});

import { describe, expect, it } from 'vitest';
import { getBotEndpoint, getBotMentionTag, getBotUsername, getEnabledStickerSets, getSanitizeRegex } from './env';

describe('env utility functions', () => {
  const mockEnv = {
    TG_TOKEN: '123456:ABCDEF',
    BOT_USERNAME: 'test',
  } as Env;
  it('should return the correct bot endpoint', () => {
    const endpoint = getBotEndpoint(mockEnv);
    expect(endpoint).toBe('/bot_123456:ABCDEF');
  });

  it('should return the correct bot username', () => {
    const username = getBotUsername(mockEnv);
    expect(username).toBe('test_bot');
  });

  it('should return the correct bot mention tag', () => {
    const mentionTag = getBotMentionTag(mockEnv);
    expect(mentionTag).toBe('@test_bot');
  });

  describe('getSanitizeRegex', () => {
    it('should return a regex that matches all string values in the environment', () => {
      const regex = getSanitizeRegex(mockEnv);
      const testString = '123456:ABCDEF test other_text';
      expect(testString.replace(regex, '[REDACTED]')).toBe('[REDACTED] [REDACTED] other_text');
    });

    it('should handle environments with mixed value types', () => {
      const mixedEnv = {
        TG_TOKEN: '123456:ABCDEF',
        BOT_USERNAME: 'test',
        SOME_NUMBER: 42,
        SOME_BOOLEAN: true,
      } as unknown as Env;
      const regex = getSanitizeRegex(mixedEnv);
      const testString = '123456:ABCDEF test 42 true';
      expect(testString.replace(regex, '[REDACTED]')).toBe('[REDACTED] [REDACTED] 42 true');
    });
  });

  describe('getEnabledStickerSets', () => {
    it('should return an array of sticker sets', () => {
      const env = { STICKER_SETS: 'set1,set2,set3' } as Env;
      const result = getEnabledStickerSets(env);
      expect(result).toEqual(['set1', 'set2', 'set3']);
    });

    it('should trim spaces from sticker sets', () => {
      const env = { STICKER_SETS: ' set1 , set2 , set3 ' } as Env;
      const result = getEnabledStickerSets(env);
      expect(result).toEqual(['set1', 'set2', 'set3']);
    });

    it('should return an empty array if STICKER_SETS is empty', () => {
      const env = { STICKER_SETS: '' } as Env;
      const result = getEnabledStickerSets(env);
      expect(result).toEqual([]);
    });

    it('should handle a single sticker set', () => {
      const env = { STICKER_SETS: 'set1' } as Env;
      const result = getEnabledStickerSets(env);
      expect(result).toEqual(['set1']);
    });

    it('should handle multiple sticker sets with extra commas', () => {
      const env = { STICKER_SETS: 'set1,,set2,,set3,' } as Env;
      const result = getEnabledStickerSets(env);
      expect(result).toEqual(['set1', '', 'set2', '', 'set3', '']);
    });
  });
});

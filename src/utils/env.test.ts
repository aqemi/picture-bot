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
});

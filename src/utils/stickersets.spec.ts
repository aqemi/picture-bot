import { describe, it, expect } from 'vitest';
import { getStickerSets } from './sticketsets';

describe('getStickerSets', () => {
  it('should return an array of sticker sets', () => {
    const env = { STICKER_SETS: 'set1,set2,set3' } as Env;
    const result = getStickerSets(env);
    expect(result).toEqual(['set1', 'set2', 'set3']);
  });

  it('should trim spaces from sticker sets', () => {
    const env = { STICKER_SETS: ' set1 , set2 , set3 ' } as Env;;
    const result = getStickerSets(env);
    expect(result).toEqual(['set1', 'set2', 'set3']);
  });

  it('should return an empty array if STICKER_SETS is empty', () => {
    const env = { STICKER_SETS: '' } as Env;;
    const result = getStickerSets(env);
    expect(result).toEqual([]);
  });

  it('should handle a single sticker set', () => {
    const env = { STICKER_SETS: 'set1' } as Env;;
    const result = getStickerSets(env);
    expect(result).toEqual(['set1']);
  });

  it('should handle multiple sticker sets with extra commas', () => {
    const env = { STICKER_SETS: 'set1,,set2,,set3,' } as Env;;
    const result = getStickerSets(env);
    expect(result).toEqual(['set1', '', 'set2', '', 'set3', '']);
  });
});
import { describe, it, expect } from 'vitest';
import { getRandomDigit } from './random';

describe('getRandomDigit', () => {
  it('should return a number between 0 and 9', () => {
    const digit = getRandomDigit();
    expect(digit).toBeGreaterThanOrEqual(0);
    expect(digit).toBeLessThanOrEqual(9);
  });

  it('should return an integer', () => {
    const digit = getRandomDigit();
    expect(Number.isInteger(digit)).toBe(true);
  });
});
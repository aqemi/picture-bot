import { describe, it, expect } from 'vitest';
import { random } from './random';

describe('random', () => {
  it('should return a number between the specified range', () => {
    const from = 1;
    const to = 10;
    const result = random(from, to);
    expect(result).toBeGreaterThanOrEqual(from);
    expect(result).toBeLessThanOrEqual(to);
  });

  it('should return an integer', () => {
    const from = 1;
    const to = 10;
    const result = random(from, to);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should throw an error if "from" is greater than "to"', () => {
    const from = 10;
    const to = 1;
    expect(() => random(from, to)).toThrowError("The 'from' value must be less than or equal to the 'to' value.");
  });

  it('should return the same number if "from" and "to" are equal', () => {
    const from = 5;
    const to = 5;
    const result = random(from, to);
    expect(result).toBe(from);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { now } from './date';

describe('now', () => {
  it('returns the current time in seconds (rounded down)', () => {
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));

    expect(now()).toBe(1672531200);

    vi.useRealTimers();
  });
});

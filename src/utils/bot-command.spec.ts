import { describe, it, expect } from 'vitest';
import { getBotCommandRegex } from './bot-command';

describe('getBotCommandRegex', () => {
  const regex = getBotCommandRegex('clear', 'mybot');

  it('matches bare command', () => {
    expect(regex.test('/clear')).toBe(true);
  });

  it('matches command with bot username', () => {
    expect(regex.test('/clear@mybot_bot')).toBe(true);
  });

  it('does not match command with different bot username', () => {
    expect(regex.test('/clear@otherbot_bot')).toBe(false);
  });

  it('does not match command with trailing text', () => {
    expect(regex.test('/clear something')).toBe(false);
  });

  it('does not match without leading slash', () => {
    expect(regex.test('clear')).toBe(false);
  });

  it('does not match partial command', () => {
    expect(regex.test('/clearall')).toBe(false);
  });
});

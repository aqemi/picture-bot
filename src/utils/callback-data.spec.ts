import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseCallbackData, ResponseCallbackType, parse, stringify } from './callback-data';

describe('ResponseCallbackData Utilities', () => {
  let callbackData: ResponseCallbackData;

  beforeEach(() => {
    callbackData = {
      type: ResponseCallbackType.Retry,
      ownerId: 1234,
      plugin: 'testPlugin',
      resultNumber: 42,
    };
  });

  it('should stringify ResponseCallbackData correctly', () => {
    const json = stringify(callbackData);
    const parsed = JSON.parse(json);
    expect(parsed).toBeInstanceOf(Object);
    expect(parsed[0]).toBe(ResponseCallbackType.Retry);
    expect(parsed[1]).toBe(1234);
    expect(parsed[2]).toBe('testPlugin');
    expect(parsed[3]).toBe(42);
  });

  it('should parse a valid minified JSON string into ResponseCallbackData', () => {
    const json = stringify(callbackData);
    const parsed = parse(json);
    expect(parsed).toEqual(callbackData);
  });

  it('should throw an error if JSON parsing fails', () => {
    expect(() => parse('INVALID_JSON')).toThrowError('Invalid JSON in callback_data');
  });

  it('should throw an error if JSON exceeds 64 bytes', () => {
    callbackData.plugin = 'a'.repeat(66); // Make the JSON larger than 64 bytes
    expect(() => stringify(callbackData)).toThrowError(/exceeds 64 bytes/);
  });

  it('should handle empty ResponseCallbackData correctly', () => {
    // @ts-expect-error test
    const emptyData = new ResponseCallbackData();
    const json = stringify(emptyData);
    const parsed = parse(json);
    expect(parsed).toEqual(emptyData);
  });

  it('should correctly compute the byte size of a string', () => {
    const testString = 'Test String';
    const size = new TextEncoder().encode(testString).length;
    expect(size).toBe(11);
  });
});

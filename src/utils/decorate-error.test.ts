import { describe, it, expect } from 'vitest';
import { decorateError } from './decorate-error';

describe('decorateError', () => {
  it('should add a toJSON method to the error if it does not exist', () => {
    const error = new Error('Test error');
    const decoratedError = decorateError(error);

    expect(decoratedError).toHaveProperty('toJSON');
    expect(typeof decoratedError.toJSON).toBe('function');
  });

  it('should not overwrite an existing toJSON method', () => {
    const error = new Error('Test error');
    Object.defineProperty(error, 'toJSON', {
      value: () => 'existing toJSON',
      configurable: true,
      writable: true,
    });

    const decoratedError = decorateError(error);

    expect(decoratedError.toJSON()).toBe('existing toJSON');
  });

  it('should return the error object with all properties serialized by toJSON', () => {
    const error = new Error('Test error');
    error.name = 'CustomError';
    error.stack = 'stack trace';
    const decoratedError = decorateError(error);

    const serialized = JSON.parse(JSON.stringify(decoratedError));
    expect(serialized).toEqual({
      message: 'Test error',
      name: 'CustomError',
      stack: 'stack trace',
    });
  });

  it('should handle non-standard error properties', () => {
    const error = new Error('Test error') as Error & { code?: number };
    error.name = 'CustomError';
    error.stack = 'stack trace';
    error.code = 500;

    const decoratedError = decorateError(error);

    const serialized = JSON.parse(JSON.stringify(decoratedError));
    expect(serialized).toEqual({
      message: 'Test error',
      name: 'CustomError',
      stack: 'stack trace',
      code: 500,
    });
  });
});
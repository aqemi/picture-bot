export function decorateError<T extends Error>(error: T): T & { toJSON: () => string } {
  if (!('toJSON' in error)) {
    Object.defineProperty(error, 'toJSON', {
      value: function () {
        const alt = {} as Record<string, unknown>;

        Object.getOwnPropertyNames(this).forEach((key) => {
          alt[key] = this[key];
        }, this);

        return alt;
      },
      configurable: true,
      writable: true,
    });
  }
  return error as T & { toJSON: () => string };
}

export function defined<T>(value: T | null | undefined, variable= 'value'): T {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${variable} to be defined, but received ${value}`);
  }
  return value;
}

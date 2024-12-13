interface FetchErrorOptions {
  code: number;
}

export class FetchError extends Error {
  public code: number;
  constructor(message: string, options: FetchErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
  }
}

export async function throwOnFetchError(res: Response) {
  if (!res.ok) {
    const message = await res.text();
    throw new FetchError(`${res.url} - ${res.statusText}: ${message}`, {
      code: res.status,
    });
  }
}

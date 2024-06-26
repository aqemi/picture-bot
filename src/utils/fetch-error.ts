interface FetchErrorOptions extends ErrorOptions {
  code: number;
}

export class FetchError extends Error {
  public code: number;
  constructor(message: string, options: FetchErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = options.code;
  }
}

export async function throwOnFetchError(res: Response) {
  if (!res.ok) {
    const message = await res.text();
    throw new FetchError(`${res.url.replace(/\/bot.+\//g, '/***/')} - ${res.statusText}: ${message}`, {
      code: res.status,
    });
  }
}

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
    let message = await res.text();
    try {
      const obj = JSON.parse(message);
      message = JSON.stringify(obj, null, 4);
    } catch (ignore) {}
    throw new FetchError(`${res.statusText}\n ${res.url}\n${message}`, { code: res.status });
  }
}

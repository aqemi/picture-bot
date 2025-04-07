type FetchErrorOptions = { url: string; code: number; body: string | object };

export class FetchError extends Error {
  public url: string;
  public code: number;
  public body: string | object;

  constructor(message: string, options: FetchErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.body = options.body;
    this.url = options.url;
  }
}

export async function throwOnFetchError(response: Response) {
  if (response.ok) {
    return;
  }
  let body: string | object;
  const text = await response.text();
  try {
    body = JSON.parse(text);
  } catch (ignore) {
    body = text;
  }

  throw new FetchError(response.statusText, { url: response.url, code: response.status, body });
}

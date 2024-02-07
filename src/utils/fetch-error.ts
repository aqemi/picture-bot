export async function throwOnFetchError(res: Response) {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`${res.url.replace(/\/bot.+\//g, '/***/')} - ${res.statusText}: ${message}`);
  }
}

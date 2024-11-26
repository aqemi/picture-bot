import { throwOnFetchError } from '../../../utils';
import { RegexBasedPlugin } from '../regex-based.plugin';
import { SearchResponse } from './tenor-api.interface';

const ITEMS_PER_PAGE = 50;

export class Tenor extends RegexBasedPlugin {
  protected regex = /^(?:gif|гиф|гифка)(?: (.+))?$/i;
  public async run({ resultNumber = 0 }: { resultNumber: number }): Promise<void> {
    const nextResultNum = resultNumber + 1;
    const params = new URLSearchParams({
      q: this.query,
      key: this.env.GOOGLE_API_KEY,
      limit: ITEMS_PER_PAGE.toString(),
      contentfilter: 'off',
      media_filter: 'mp4',
      client_key: 'ohime_sama_bot',
    });
    const url = `https://tenor.googleapis.com/v2/search?${params}`;

    const response = await fetch(url, {
      cf: {
        cacheEverything: true,
        cacheTtl: 86400,
      },
    });
    await throwOnFetchError(response);
    const results: SearchResponse = await response.json();

    const result = results.results[resultNumber]?.media_formats.mp4.url;
    if (!result) {
      return this.notFound();
    }

    const reply_markup = this.hasNext(results, nextResultNum) ? this.getKeyboard(nextResultNum) : undefined;

    await this.api.sendAnimation({
      chat_id: this.ctx.chatId,
      animation: result,
      reply_to_message_id: this.replyTo,
      reply_markup,
      disable_notification: true,
      caption: this.ctx.caption ?? undefined,
    });
  }

  private hasNext(results: SearchResponse, index: number): boolean {
    return !!results.results[index];
  }
}

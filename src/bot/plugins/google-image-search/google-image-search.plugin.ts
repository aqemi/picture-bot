import { throwOnFetchError } from '../../../utils';
import { RegexBasedPlugin } from '../regex-based.plugin';
import { Schema$Search } from './custom-search-api.interface';

const ITEMS_PER_PAGE = 10;
const MAX_RETRIES = 5;

export class GoogleImageSearch extends RegexBasedPlugin {
  private retry = 0;

  protected regex = /^(?:пик|пикча|img|image|pic|picture)(?: (.+))?$/i;

  public async run({ resultNumber = 0 }: { resultNumber: number }): Promise<void> {
    const start = Math.floor(resultNumber / ITEMS_PER_PAGE) * 10 + 1;
    const resultNumInChunk = resultNumber % ITEMS_PER_PAGE;
    const nextResultNum = resultNumber + 1;
    const nextResultNumInChunk = resultNumInChunk + 1;

    const params = new URLSearchParams({
      searchType: 'image',
      q: this.query,
      key: this.env.GOOGLE_API_KEY,
      cx: this.env.CUSTOM_SEARCH_ENGINE_ID,
      num: ITEMS_PER_PAGE.toString(),
      start: start.toString(),
      safe: 'off',
      fields: 'items.link,queries.nextPage',
    });

    const url = `https://www.googleapis.com/customsearch/v1?${params}`;

    const response = await fetch(url, {
      cf: {
        cacheEverything: true,
        cacheTtl: 86400,
      },
    });
    await throwOnFetchError(response);
    const results: Schema$Search = await response.json();

    const result = results.items?.[resultNumInChunk]?.link;
    if (!result) {
      return this.notFound();
    }

    const reply_markup = this.hasNext(results, nextResultNumInChunk) ? this.getKeyboard(nextResultNum) : undefined;

    try {
      await this.api.sendPhoto({
        chat_id: this.ctx.chatId,
        photo: result,
        reply_to_message_id: this.replyTo,
        caption: this.ctx.caption ?? undefined,
        reply_markup,
        disable_notification: true,
      });
    } catch (err) {
      this.retry += 1;
      if (this.retry > MAX_RETRIES) {
        throw err;
      } else {
        console.log(`Retrying (${this.retry})`, err);
        await this.run({ resultNumber: nextResultNum });
      }
    }
  }

  private hasNext(results: Schema$Search, index: number): boolean {
    return !!results.items?.[index] || !!results.queries?.nextPage;
  }
}

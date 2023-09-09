import { throwOnFetchError } from '../../../utils';
import { Plugin } from '../base.plugin';
import { SearchResponse } from './tenor-api.interface';

const ITEMS_PER_PAGE = 50;

export class Tenor extends Plugin {
  public async processAndRespond(resultNum: number): Promise<void> {
    const nextResultNum = resultNum + 1;
    const params = new URLSearchParams({
      q: this.ctx.query,
      key: this.ctx.env.GOOGLE_API_KEY,
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

    const result = results.results[resultNum]?.media_formats.mp4.url;
    if (!result) {
      return this.noneFound();
    }

    const reply_markup = this.hasNext(results, nextResultNum) ? this.getMoreButton(nextResultNum) : undefined;

    await this.api.sendAnimation({
      chat_id: this.ctx.chatId,
      animation: result,
      reply_to_message_id: this.ctx.replyTo,
      reply_markup,
      disable_notification: true,
      caption: this.ctx.caption,
    });
  }

  private hasNext(results: SearchResponse, index: number): boolean {
    return !!results.results[index];
  }
}

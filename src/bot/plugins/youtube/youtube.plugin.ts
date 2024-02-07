import { throwOnFetchError } from '../../../utils';
import { Plugin } from '../base.plugin';
import { Schema$SearchListResponse } from './youtube-api.interface';

const ITEMS_PER_PAGE = 50;

export class Youtube extends Plugin {
  public async processAndRespond(resultNum: number): Promise<void> {
    const nextResultNum = resultNum + 1;
    const params = new URLSearchParams({
      type: 'video',
      q: this.ctx.query,
      key: this.ctx.env.GOOGLE_API_KEY,
      maxResults: ITEMS_PER_PAGE.toString(),
      safeSearch: 'none',
      fields: 'items.id.videoId',
    });
    const url = `https://www.googleapis.com/youtube/v3/search?${params}`;

    const response = await fetch(url, {
      cf: {
        cacheEverything: true,
        cacheTtl: 86400,
      },
    });
    await throwOnFetchError(response);
    const results: Schema$SearchListResponse = await response.json();

    const result = results.items?.[resultNum]?.id?.videoId;
    if (!result) {
      return this.noneFound();
    }

    const reply_markup = this.hasNext(results, nextResultNum) ? this.getKeyboard(nextResultNum) : undefined;

    const caption = this.ctx.caption ? `${this.ctx.caption}\n` : '';
    const text = `${caption}https://www.youtube.com/watch?v=${result}`;
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text,
      reply_to_message_id: this.ctx.replyTo,
      reply_markup,
      disable_notification: true,
    });
  }

  private hasNext(results: Schema$SearchListResponse, index: number): boolean {
    return !!results.items?.[index];
  }
}

import { throwOnFetchError } from '../../../utils';
import { Plugin } from '../base.plugin';
import { SearchResponse } from './nekos-api.interface';

export class Nekos extends Plugin {
  public async processAndRespond(): Promise<void> {
    const fetchUrl = `https://eodizj8d2hw1bkz.m.pipedream.net/${this.ctx.query}`;
    const response = await fetch(fetchUrl);
    await throwOnFetchError(response);

    const result: SearchResponse = await response.json();
    if (!result?.image) {
      return this.noneFound();
    }
    const { image: url } = result;

    const reply_markup = this.getKeyboard(0);

    if (this.isAnimation(url)) {
      await this.api.sendAnimation({
        chat_id: this.ctx.chatId,
        animation: url,
        reply_to_message_id: this.ctx.replyTo,
        reply_markup,
        disable_notification: true,
        caption: this.ctx.caption,
      });
    } else {
      await this.api.sendPhoto({
        chat_id: this.ctx.chatId,
        photo: url,
        reply_to_message_id: this.ctx.replyTo,
        reply_markup,
        disable_notification: true,
        caption: this.ctx.caption,
      });
    }
  }

  isAnimation(url: string) {
    return url.endsWith('.gif');
  }
}

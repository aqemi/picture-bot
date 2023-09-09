import { throwOnFetchError } from '../../../utils';
import { Plugin } from '../base.plugin';
import { DeepAiResponse } from './deep-ai-api.interface';

export class DeepAI extends Plugin {
  public async processAndRespond(resultNum: number): Promise<void> {
    const url = 'https://api.deepai.org/api/text2img';
    const formData = new FormData();
    formData.set('text', this.ctx.query);
    formData.set('grid_size', '1');
    const headers = new Headers({
      'api-key': this.ctx.env.DEEP_AI_API_KEY,
    });
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    await throwOnFetchError(response);
    const result: DeepAiResponse = await response.json();

    const reply_markup = this.getMoreButton(resultNum + 1);

    await this.api.sendPhoto({
      chat_id: this.ctx.chatId,
      photo: result.output_url,
      reply_to_message_id: this.ctx.replyTo,
      caption: this.ctx.caption,
      reply_markup,
      disable_notification: true,
    });
  }
}

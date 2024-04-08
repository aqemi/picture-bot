import { throwOnFetchError } from '../../../utils';
import { Plugin } from '../base.plugin';

export class Test extends Plugin {
  public async processAndRespond(): Promise<void> {
    switch (this.ctx.query) {
      case '1': {
        throw new Error('test');
      }

      case '2': {
        const res = await fetch('https://example.com/404');
        await throwOnFetchError(res);
        break;
      }

      case '3': {
        const res = await fetch('http://1.0.0.0');
        await throwOnFetchError(res);
        break;
      }

      case '4': {
        await this.ctx.tg.deleteMessage({ chat_id: 0, message_id: 0 });
        break;
      }
    }
  }
}

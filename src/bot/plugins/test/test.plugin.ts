import { throwOnFetchError } from '../../../utils';
import { RegexBasedPlugin } from '../regex-based.plugin';

export class Test extends RegexBasedPlugin {
  protected regex = /^test (\d+)$/i;
  public async run(): Promise<void> {
    switch (this.query) {
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
        await this.api.deleteMessage({ chat_id: 0, message_id: 0 });
        break;
      }
    }
  }
}

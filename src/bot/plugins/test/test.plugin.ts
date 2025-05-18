import { throwOnFetchError } from '../../../utils';
import { RegexBasedPlugin } from '../regex-based.plugin';

export class TestPlugin extends RegexBasedPlugin {
  protected regex = /^\/runtests$/;
  protected queryRequired = false;

  public async run(): Promise<void> {
    const tests = [this.testDefaultError, this.testHttpError, this.testNetworkError, () => this.testTelegramError()];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        await this.responseHelper.sendError(this.ctx.chatId, error, this.ctx.replyToId);
      }
    }

    await this.responseHelper.sendJSON(this.ctx.chatId, {
      s: 'string',
      n: 1,
      b: false,
      nil: null,
      o: {},
      a: [],
    });
  }

  private async testDefaultError() {
    throw new Error('TEST');
  }

  private async testHttpError() {
    const res = await fetch('https://example.com/404');
    await throwOnFetchError(res);
  }

  private async testNetworkError() {
    const res = await fetch('https://localhost:1234/404');
    await throwOnFetchError(res);
  }

  private async testTelegramError() {
    await this.api.deleteMessage({ chat_id: 0, message_id: 0 });
  }
}

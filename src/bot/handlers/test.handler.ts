import { Update } from 'node-telegram-bot-api';
import { defined, throwOnFetchError } from '../../utils';
import { TelegramUpdateHandler } from './base.handler';

export class TestHandler extends TelegramUpdateHandler {
  public match(payload: Update): boolean {
    return payload?.message?.text === '/runtests';
  }

  public async handle(payload: Update): Promise<void> {
    console.log('🚀 ~ TestHandler ~ handle ~ payload:', payload);
    await this.runTests(payload);
  }

  public async runTests(payload: Update): Promise<void> {
    await this.testReportError(payload);
  }

  private async testReportError(payload: Update) {
    const tests = [this.testDefaultError, this.testHttpError, this.testNetworkError, () => this.testTelegramError()];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        await this.reportError(error, {
          chatId: defined(payload.message?.chat?.id),
          replyTo: defined(payload.message?.from?.id),
        });
      }
    }
  }

  private async testDefaultError() {
    throw new Error('test');
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

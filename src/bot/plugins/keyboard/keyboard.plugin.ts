import { RegexBasedPlugin } from '../regex-based.plugin';

export class Keyboard extends RegexBasedPlugin {
  protected regex = /^амикей (даун)/iu;

  public async run(): Promise<void> {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: '+',
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }
}

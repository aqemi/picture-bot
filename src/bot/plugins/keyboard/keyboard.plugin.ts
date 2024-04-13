import { Plugin } from '../base.plugin';

export class Keyboard extends Plugin {
  static matcher = /^амикей (даун)/iu;
  public async processAndRespond(): Promise<void> {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: '+',
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }
}

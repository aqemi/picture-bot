import { getBotCommandRegex } from '../../../utils';
import { RegexBasedPlugin } from '../regex-based.plugin';

export class Keyboard extends RegexBasedPlugin {
  protected get regex() {
    return getBotCommandRegex('rmkeyboard', this.env.BOT_USERNAME);
  }

  public async run(): Promise<void> {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: '🔨💥',
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }
}

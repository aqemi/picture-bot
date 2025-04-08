import { RegexBasedPlugin } from '../regex-based.plugin';

export class RestartPromptPlugin extends RegexBasedPlugin {
  protected regex = /^!restart$/;
  protected queryRequired = false;
  public async run(): Promise<void> {
    await this.env.DB.prepare('DELETE FROM threads WHERE chatId = ?').bind(this.ctx.chatId).run();
    await this.api.setMessageReaction({
      chat_id: this.ctx.chatId,
      message_id: this.ctx.messageId,
      reaction: [{ type: 'emoji', emoji: '👍' }],
      is_big: true,
    });
  }
}

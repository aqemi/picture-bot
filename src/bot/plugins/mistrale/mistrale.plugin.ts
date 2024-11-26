import { BasePlugin } from '../base.plugin';

export class MistralePlugin extends BasePlugin {
  private get botMention(): string {
    return `@${this.env.BOT_USERNAME}_bot`;
  }

  public match(): boolean {
    return this.ctx.text.includes(this.botMention) || this.ctx.replyToThisBot;
  }
  public async run(): Promise<void> {}
}

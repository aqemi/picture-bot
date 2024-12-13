import { Sticker } from 'node-telegram-bot-api';
import { defined } from '../../../utils';
import { TelegramApi } from '../../telegram-api';
import { BasePlugin, InvocationContext, PluginDerived } from '../base.plugin';
import { GoogleImageSearch } from '../google-image-search/google-image-search.plugin';
import { Tenor } from '../tenor/tenor.plugin';
import { Youtube } from '../youtube/youtube.plugin';
import { config } from './config';
import { MistraleAgent } from './mistrale-agent';

const plugins: PluginDerived[] = [GoogleImageSearch, Youtube, Tenor];

export class MistralePlugin extends BasePlugin {
  private readonly agent: MistraleAgent;
  constructor(
    protected readonly ctx: InvocationContext,
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {
    super(ctx, api, env);
    this.agent = new MistraleAgent(env);
  }

  private get botMention(): string {
    return `@${this.env.BOT_USERNAME}_bot`;
  }

  public async match(): Promise<boolean> {
    return (
      this.ctx.text.includes(this.botMention) ||
      this.ctx.replyToThisBot ||
      ((await this.isActive()) && !this.ctx.replyToId && !this.ctx.text.includes('@'))
    );
  }

  public async run(): Promise<void> {
    const response = await this.agent.completion({
      query: this.ctx.text,
      username: this.ctx.initiatorName,
      chatId: this.ctx.initiatorId,
    });
    console.debug('ai response', response);

    if (!response.valid) {
      await this.sendRaw(response.raw);
      return;
    }

    if (response.text) {
      await this.sendText(response.text);
    }

    if (response.sticker) {
      const sticker = await this.getSticker(response.sticker);
      if (!sticker) {
        console.debug(`Invalid sticker ${response.sticker}`);
        if (!response.text) {
          await this.sendText(response.sticker);
        }
      } else {
        await this.sendSticker(response.sticker);
      }
    }
  }

  private async sendText(text: string): Promise<void> {
    const { result: sent } = await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      reply_to_message_id: this.ctx.messageId,
      text,
    });

    await this.postProcessMessage(
      defined(sent.text, 'sent.text'),
      sent.message_id,
      defined(sent.from?.id, 'sent.from?.id'),
    );
  }

  private async sendRaw(raw: string) {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      reply_to_message_id: this.ctx.messageId,
      text: `\`\`\`json${raw}\`\`\``,
    });
  }

  private async sendSticker(fileId: string) {
    await this.api.sendSticker({
      chat_id: this.ctx.chatId,
      sticker: fileId,
    });
  }

  private async getSticker(emoji: string): Promise<Sticker | null> {
    const stickerpacks = await Promise.all(config.stickerSetsNames.map((name) => this.api.getStickerSet({ name })));
    const stickers = await Promise.all(stickerpacks.flatMap((x) => x.result.stickers));
    const matchedStickers = stickers.filter((x) => x.emoji === emoji);
    if (!matchedStickers.length) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * matchedStickers.length);
    return matchedStickers[randomIndex];
  }

  private async isActive(): Promise<boolean> {
    const result = await this.env.DB.prepare(
      `SELECT COUNT(*) AS count FROM threads WHERE createdAt > DATETIME(CURRENT_TIMESTAMP, '${config.allReplyCooldown}') AND chatId = ?`,
    )
      .bind(this.ctx.chatId)
      .first<{ count: number }>();

    return !!result && result.count > 0;
  }

  private async postProcessMessage(text: string, messageId: number, initiatorId: number) {
    const ctx: InvocationContext = {
      chatId: this.ctx.chatId,
      messageId,
      replyToId: messageId,
      initiatorId,
      initiatorName: 'ohime',
      text,
      replyToThisBot: false,
    };

    for (const Plugin of plugins) {
      const plugin = new Plugin(ctx, this.api, this.env);
      if (await plugin.match()) {
        return await plugin.run({});
      }
    }
  }
}

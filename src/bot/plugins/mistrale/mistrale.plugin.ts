import { Sticker } from 'node-telegram-bot-api';
import { defined } from '../../../utils';
import { getStickerSets } from '../../../utils/sticketsets';
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
      if (sticker) {
        await this.sendSticker(sticker.file_id);
      } else {
        await this.sendText(response.sticker);
      }
    }
  }

  private async sendText(text: string): Promise<void> {
    const { result: sent } = await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      reply_to_message_id: this.ctx.messageId,
      text,
    });

    await this.postProcessMessage({
      text: defined(sent.text, 'sent.text'),
      chatId: this.ctx.chatId,
      messageId: sent.message_id,
      replyToId: sent.message_id,
      businessConnectionId: this.ctx.businessConnectionId,
      initiatorId: defined(sent.from?.id, 'sent.from?.id'),
      initiatorName: defined(sent.from?.username),
      replyToThisBot: false,
      isPrivate: this.ctx.isPrivate,
    });
  }

  private async sendRaw(raw: string) {
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      reply_to_message_id: this.ctx.messageId,
      parse_mode: 'MarkdownV2',
      text: `\`\`\`json\n${raw}\n\`\`\``,
    });
  }

  private async sendSticker(fileId: string) {
    console.log('🚀 ~ MistralePlugin ~ sendSticker ~ fileId:', fileId);
    await this.api.sendSticker({ chat_id: this.ctx.chatId, sticker: fileId });
  }

  private async getSticker(emoji: string): Promise<Sticker | null> {
    const stickerpacks = await Promise.all(getStickerSets(this.env).map((name) => this.api.getStickerSet({ name })));
    const stickers = await Promise.all(stickerpacks.flatMap((x) => x.result.stickers));
    const matchedStickers = stickers.filter((x) => x.emoji === emoji);
    if (!matchedStickers.length) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * matchedStickers.length);
    return matchedStickers[randomIndex];
  }

  private async isActive(): Promise<boolean> {
    try {
      const result = await this.env.DB.prepare(
        `SELECT COUNT(*) AS count FROM threads WHERE createdAt > DATETIME(CURRENT_TIMESTAMP, '${config.allReplyCooldown}') AND chatId = ?`,
      )
        .bind(this.ctx.chatId)
        .first<{ count: number }>();

      return !!result && result.count > 0;
    } catch (error) {
      if (this.ctx.isPrivate) {
        throw error; // display error to user
      }
      console.error('Error on thread activity check', error);
      return false;
    }
  }

  private async postProcessMessage(ctx: InvocationContext) {
    for (const Plugin of plugins) {
      const plugin = new Plugin(ctx, this.api, this.env);
      if (await plugin.match()) {
        return await plugin.run({});
      }
    }
  }
}

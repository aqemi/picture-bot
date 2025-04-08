import type { Message, Sticker, Update as TelegramUpdate } from 'node-telegram-bot-api';
import { defined } from '../../utils';
import { getStickerSets } from '../../utils/sticketsets';
import { GoogleImageSearch, InvocationContext, PluginDerived, Tenor, Youtube } from '../plugins';
import { config } from '../plugins/mistrale/config';
import { MistraleAgent } from '../plugins/mistrale/mistrale-agent';
import { TelegramApi } from '../telegram-api';
import { TelegramUpdateHandler } from './base.handler';

const plugins: PluginDerived[] = [GoogleImageSearch, Youtube, Tenor];

type AiHandlerContext = {
  text: string;
  chatId: number;
  isPrivate: boolean;
  isBusiness: boolean;
  businessConnectionId?: string;
  messageId: number;
};

export class AiHandler extends TelegramUpdateHandler {
  private readonly agent: MistraleAgent;
  protected ctx!: AiHandlerContext;

  constructor(
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {
    super(api, env);
    this.agent = new MistraleAgent(env);
  }

  async match(payload: TelegramUpdate) {
    const { message } = payload;
    if (!message) {
      return false;
    }
    await this.loadContext(message);
    return (
      this.isMentioned() ||
      this.replyToThisBot(message) ||
      (!this.someoneElseMentioned() && !this.replyToSomeoneElse(message) && (await this.isActive()))
    );
  }

  private async loadContext(message: Message) {
    this.ctx = {
      text: await this.extractText(message),
      chatId: message.chat.id,
      isPrivate: message.chat.type === 'private',
      isBusiness: !!message.business_connection_id,
      businessConnectionId: message.business_connection_id,
      messageId: message.message_id,
    };
  }

  private isMentioned(): boolean {
    return this.ctx.text.includes(this.botMention) ?? false;
  }

  private replyToThisBot(message: Message): boolean {
    return message.reply_to_message?.from?.username === this.botUsername;
  }

  private someoneElseMentioned(): boolean {
    return /@\w/.test(this.ctx.text ?? '') && !this.isMentioned();
  }

  private replyToSomeoneElse(message: Message): boolean {
    return !!message.reply_to_message && message.reply_to_message.from?.username !== this.botUsername;
  }

  async handle(payload: TelegramUpdate) {
    const { message } = payload;
    try {
      await this.handleMessage(defined(message, 'message'));
    } catch (error) {
      await this.reportError(error, {
        chatId: defined(message, 'message').chat.id,
        replyTo: defined(message, 'message').message_id,
      });
    }
  }

  async handleMessage(message: Message) {
    await this.loadContext(message);
    const query = await this.extractText(message);
    const response = await this.agent.completion({
      query,
      username: message.from!.username ?? message.from!.first_name,
      chatId: message.chat.id,
    });

    console.debug('ai response', { ...response, query });

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
      business_connection_id: this.ctx.businessConnectionId,
      reply_to_message_id: this.ctx.messageId,
      text,
    });

    if (!this.ctx.isBusiness) {
      await this.postProcessMessage({
        text: defined(sent.text, 'sent.text'),
        chatId: this.ctx.chatId,
        messageId: sent.message_id,
        replyToId: sent.message_id,
        businessConnectionId: this.ctx.businessConnectionId,
        initiatorId: defined(sent.from?.id, 'sent.from?.id'),
        initiatorName: defined(sent.from?.username),
      });
    }
  }

  private async sendRaw(raw: string) {
    if (this.ctx.isBusiness) {
      return;
    }

    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      reply_to_message_id: this.ctx.messageId,
      business_connection_id: this.ctx.businessConnectionId,
      parse_mode: 'MarkdownV2',
      text: `\`\`\`json\n${raw}\n\`\`\``,
    });
  }

  private async sendSticker(fileId: string) {
    await this.api.sendSticker({
      chat_id: this.ctx.chatId,
      sticker: fileId,
      business_connection_id: this.ctx.businessConnectionId,
    });
  }

  private async getSticker(emoji: string): Promise<Sticker | null> {
    const stickersets = await Promise.all(getStickerSets(this.env).map((name) => this.api.getStickerSet({ name })));
    const stickers = await Promise.all(stickersets.flatMap((x) => x.result.stickers));
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
      if (this.displayErrors()) {
        await this.reportError(error, { chatId: this.ctx.chatId, replyTo: this.ctx.messageId });
      } else {
        console.error('Error on thread activity check', error);
      }
      return false;
    }
  }

  private displayErrors(): boolean {
    return this.ctx.isPrivate && !this.ctx.isBusiness;
  }

  private async postProcessMessage(ctx: InvocationContext) {
    for (const Plugin of plugins) {
      const plugin = new Plugin(ctx, this.api, this.env);
      if (await plugin.match()) {
        return await plugin.run({});
      }
    }
  }
  private async extractText(message: Message): Promise<string> {
    if (message.text) {
      return message.text;
    }
    // Optional. Caption for the animation, audio, document, paid media, photo, video or voice

    if (message.animation) {
      return this.encloseInTags('GIF', message.animation.file_name, message.caption);
    }
    if (message.audio) {
      return this.encloseInTags(
        'AUDIO',
        message.audio.file_name,
        message.audio.performer,
        message.audio.title,
        message.caption,
      );
    }
    if (message.document) {
      return this.encloseInTags('FILE', message.document.file_name, message.caption);
    }
    if (message.paid_media) {
      return this.encloseInTags('PAID_MEDIA', message.caption);
    }
    if (message.photo) {
      return this.encloseInTags('PHOTO', message.caption);
    }
    if (message.sticker) {
      return this.encloseInTags('STICKER', message.sticker.set_name, message.sticker.emoji);
    }
    if (message.story) {
      return this.encloseInTags('STORY');
    }
    if (message.video) {
      return this.encloseInTags('VIDEO', message.video.file_name, message.caption);
    }
    if (message.video_note) {
      return this.encloseInTags('VIDEO_MESSAGE');
    }
    if (message.voice) {
      return this.encloseInTags('VOICE_MESSAGE', message.caption);
    }
    if (message.contact) {
      return this.encloseInTags(
        'CONTACT',
        message.contact.first_name,
        message.contact.last_name,
        message.contact.phone_number,
      );
    }
    if (message.dice) {
      return this.encloseInTags('DICE', message.dice.emoji, `result:${message.dice.value}`);
    }
    if (message.game) {
      return this.encloseInTags('GAME', message.game.title, message.game.description, message.game.text);
    }
    if (message.poll) {
      return this.encloseInTags(
        'POLL',
        `${message.poll.question}?`,
        message.poll.options.map((x) => x.text).join(', '),
      );
    }
    if (message.venue) {
      return this.encloseInTags('VENUE', message.venue.title, message.venue.address);
    }
    if (message.location) {
      return this.encloseInTags('LOCATION', `${message.location.latitude} ${message.location.longitude}`);
    }

    return this.encloseInTags('NOT_PARSED_TEXT');
  }

  private encloseInTags(tag: string, ...content: (string | undefined)[]) {
    const text = content.filter((x) => x).join(' - ');
    if (!text) {
      return `<${tag}/>`;
    }
    return `<${tag}>${text}</${tag}>`;
  }
}

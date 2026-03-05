import { Mistral } from '@mistralai/mistralai';
import { BasePlugin } from '../base.plugin';

const REGEX = /[їєіґ]/iu;

export class TranslatePlugin extends BasePlugin {
  public match(): boolean {
    return !!this.ctx.isForwarded && REGEX.test(this.ctx.text);
  }

  public async run(): Promise<void> {
    this.api.sendChatAction({ action: 'typing', chat_id: this.ctx.chatId });

    const client = new Mistral({
      apiKey: this.env.MISTRAL_API_KEY,
      serverURL: `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.AI_GATEWAY_ID}/mistral`,
    });

    const { choices } = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a translator. Translate the user message to Chuvash language. Return only the translation, nothing else.',
        },
        {
          role: 'user',
          content: this.ctx.text,
        },
      ],
    });

    const content = choices?.[0]?.message.content;
    const translation = typeof content === 'string' ? content : null;

    if (!translation) {
      throw new Error('No translation in response');
    }

    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      text: translation,
      reply_to_message_id: this.ctx.replyToId ?? this.ctx.messageId,
      disable_notification: true,
    });
  }
}

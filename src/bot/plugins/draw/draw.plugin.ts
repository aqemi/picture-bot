import { RegexBasedPlugin } from '../regex-based.plugin';

export class DrawPlugin extends RegexBasedPlugin {
  protected regex = /^(?:\/draw)(?: (.+))?$/i;

  public async run(): Promise<void> {
    const prompt = this.query;
    const inputs = {
      prompt,
      height: 768,
      width: 768,
      maxTokens: 512,
      guidance: 7,
    };

    const response = await this.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', inputs);
    const blob = await new Response(response).blob();

    await this.api.sendPhotoAsBlob({
      chat_id: this.ctx.chatId,
      photo: blob,
      reply_to_message_id: this.replyTo,
      caption: this.ctx.caption ?? '',
      reply_markup: JSON.stringify(this.getKeyboard(1)) as any,
      disable_notification: true,
    });
  }
}

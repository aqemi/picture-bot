import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { GifManager } from '../../managers/gif.manager';
import { PromptManager } from '../../managers/prompt.manager';
import { defined } from '../../utils';
import { ResponseHelper } from '../response-helper';
import { TelegramApi } from '../telegram-api';
import { TelegramUpdateHandler } from './base.handler';

export class StoreGifHandler extends TelegramUpdateHandler {
  constructor(
    protected readonly api: TelegramApi,
    protected readonly env: Env,
    protected readonly responseHelper: ResponseHelper,
  ) {
    super(api, env, responseHelper);
  }

  async match(payload: TelegramUpdate) {
    const { message } = payload;
    return !!message?.animation && message?.chat.type === 'private' && message.reply_to_message?.text === '/storegif';
  }

  async handle(payload: TelegramUpdate) {
    const { message } = payload;
    const thumb = message?.animation?.thumb;
    if (!thumb) {
      await this.api.sendMessage({
        chat_id: defined(message).chat.id,
        reply_to_message_id: message?.message_id,
        text: 'No thumb to analyze',
      });
      return;
    }
    const { result: file } = await this.api.getFile({ file_id: thumb.file_id });
    const url = await this.api.getFileUrl(file);
    const gifManager = new GifManager(this.env);
    const description = await gifManager.addGif(message.animation!.file_id, url);

    const prompt = await gifManager.getPrompt();
    const promptManager = new PromptManager(this.env);
    await promptManager.updateSystemPrompt('gif', prompt);

    await this.responseHelper.sendJSON(
      message.chat.id,
      {
        file_id: message.animation?.file_id,
        description,
      },
      message.message_id,
    );
  }
}

import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { MistraleAgent } from '../plugins/mistrale/mistrale-agent';
import { TelegramApi } from '../telegram-api';
import { TelegramUpdateHandler } from './base.handler';
import { defined } from '../../utils';

export class StoreGifHandler extends TelegramUpdateHandler {
  private readonly agent: MistraleAgent;
  constructor(
    protected readonly api: TelegramApi,
    protected readonly env: Env,
  ) {
    super(api, env);
    this.agent = new MistraleAgent(env);
  }

  async match(payload: TelegramUpdate) {
    const { message } = payload;
    return !!message?.animation && message?.chat.type === 'private' && message.reply_to_message?.text === 'storegif';
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
    const gifDescription = await this.agent.classifyImage(url);
    await this.env.DB.prepare('INSERT INTO gifs (file_id, description) VALUES(?,?)')
      .bind(message.animation?.file_id, gifDescription)
      .run();
    await this.reloadPrompt();
    await this.api.sendJSON({
      chat_id: message.chat.id,
      json: {
        file_id: message.animation?.file_id,
        gifDescription,
      },
      reply_to_message_id: message.message_id,
    });
  }

  private async reloadPrompt() {
    const { results: gifs } = await this.env.DB.prepare('SELECT * FROM gifs').all();
    const prompt = `Доступные гифки:\n\n${gifs.map((x) => `${x.id} - ${x.description}`).join('\n')}`;
    await this.env.DB.prepare(
      'INSERT INTO prompts (id, role, content) VALUES (?1, ?2, ?3) ON CONFLICT DO UPDATE SET content = ?3',
    )
      .bind('gifs', 'system', prompt)
      .run();
  }
}

import { Chat } from 'node-telegram-bot-api';
import { Thread } from './thread.manager';
import { SystemMessage } from '@mistralai/mistralai/models/components';

export class PromptManager {
  constructor(private readonly env: Env) {}

  public async updateSystemPrompt(id: string, content: string): Promise<void> {
    await this.env.DB.prepare(
      'INSERT INTO prompts (id, role, content) VALUES (?1, ?2, ?3) ON CONFLICT DO UPDATE SET content = ?3',
    )
      .bind(id, 'system', content)
      .run();
  }

  public async getSystemPrompt(): Promise<Thread> {
    const { results } = await this.env.DB.prepare(`SELECT * FROM prompts`).run<{
      id: string | null;
      role: string;
      content: string;
    }>();

    return results.map((x) => ({
      role: x.role as 'system' | 'user' | 'assistant',
      content: x.content,
    }));
  }

  public getChatPrompt(title: string): SystemMessage & { role: 'system' } {
    return {
      role: 'system',
      content: `Название чата: ${title}`,
    };
  }
}

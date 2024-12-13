import { Mistral } from '@mistralai/mistralai';
import { AssistantMessage, SystemMessage, ToolMessage, UserMessage } from '@mistralai/mistralai/models/components';
import { config } from './config';

type AiResponse = {
  text?: string;
  sticker?: string;
  valid: boolean;
  raw: string;
};

type ThreadMessage = {
  chatId: number;
  createdAt: string;
  role: 'assistant' | 'user';
  content: string;
};

type PromptTraits = {
  aggressive: boolean;
};

type Thread = Array<
  | (SystemMessage & { role: 'system' })
  | (UserMessage & { role: 'user' })
  | (AssistantMessage & { role: 'assistant' })
  | (ToolMessage & { role: 'tool' })
>;

type CompletionParams = {
  query: string;
  username: string;
  chatId: number;
};

export class MistraleAgent {
  private readonly client: Mistral;
  private readonly db: D1Database;
  constructor(private readonly env: Env) {
    this.client = new Mistral({
      apiKey: this.env.MISTRAL_API_KEY,
      serverURL: `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.AI_GATEWAY_ID}/mistral`,
    });
    this.db = this.env.DB;
  }

  public async completion({ query, chatId, username }: CompletionParams): Promise<AiResponse> {
    const formettedQuery = `[USERNAME]${username}[/USERNAME]: ${query}`;
    await this.appendThread({ chatId, content: formettedQuery, role: 'user' });
    const prompt = await this.getPrompt({ aggressive: true });
    const thread = await this.getThread(chatId);
    const { choices } = await this.client.agents.complete({
      agentId: this.env.MISTRAL_AGENT_ID,
      messages: [...prompt, ...thread],
      responseFormat: { type: 'json_object' },
    });

    const content = choices?.[0].message.content;
    if (typeof content === 'string') {
      await this.appendThread({ chatId, role: 'assistant', content });
      const parsed = this.parseAiResponse(content);
      return parsed;
    } else {
      return {
        valid: false,
        raw: content?.toString() ?? 'EMPTY',
      };
    }
  }

  private async getPrompt(traits: PromptTraits): Promise<Thread> {
    const { results } = await this.env.DB.prepare(`SELECT * FROM prompts`).run<{
      id: string | null;
      role: string;
      content: string;
    }>();

    const dynamicPrompt = results.map((x) => ({
      role: x.role as 'system' | 'user' | 'assistant',
      content: x.content,
    }));

    const finalPrompt = [...config.demo.basic, ...dynamicPrompt, ...(traits.aggressive ? config.demo.aggressive : [])];

    return finalPrompt.sort((a, b) => {
      if (a.role === 'system' && b.role !== 'system') {
        return -1; // 'a' should come before 'b' if 'a' is 'system'
      } else if (b.role === 'system' && a.role !== 'system') {
        return 1; // 'b' should come before 'a' if 'b' is 'system'
      }
      return 0; // Keep other roles in the same order
    }) as Thread;
  }

  private parseAiResponse(raw: string): AiResponse {
    try {
      const parsed = JSON.parse(raw);
      return { valid: this.validateAiResponse(parsed), raw, ...parsed };
    } catch (error) {
      return { valid: false, raw };
    }
  }

  private validateAiResponse(response: AiResponse): boolean {
    if (typeof response !== 'object' || response === null) {
      return false;
    }
    if ('text' in response && (typeof response.text !== 'string' || !response.text)) {
      return false;
    }
    if ('sticker' in response && (typeof response.sticker !== 'string' || !response.sticker)) {
      return false;
    }
    if (!response.text && !response.sticker) {
      return false;
    }
    return true;
  }

  private async getThread(chatId: number): Promise<Thread> {
    const { results } = await this.env.DB.prepare('SELECT * FROM threads WHERE chatId = ?')
      .bind(chatId)
      .all<ThreadMessage>();
    return results.map((x) => ({ role: x.role, content: x.content }));
  }

  private async appendThread(message: Omit<ThreadMessage, 'createdAt'>): Promise<void> {
    await this.env.DB.prepare('INSERT INTO threads (chatId, role, content) VALUES(?,?,?)')
      .bind(message.chatId, message.role, message.content)
      .run();
  }
}

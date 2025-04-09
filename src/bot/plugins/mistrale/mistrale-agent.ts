import { Mistral } from '@mistralai/mistralai';
import { type Thread, type ThreadManager } from '../../../managers/thread.manager';
import { config } from './config';
import { PromptManager } from '../../../managers/prompt.manager';

type AiResponse = {
  text?: string;
  sticker?: string;
  gif?: string | number;
  valid: boolean;
  raw: string;
};

type ConversationTraits = {
  aggressive: boolean;
};

type CompletionParams = {
  query: string;
  username: string;
  chatId: number;
};

export class MistraleAgent {
  private readonly client: Mistral;
  constructor(
    private readonly env: Env,
    private readonly threadManager: ThreadManager,
    private readonly promptManager: PromptManager,
  ) {
    this.client = new Mistral({
      apiKey: this.env.MISTRAL_API_KEY,
      serverURL: `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.AI_GATEWAY_ID}/mistral`,
    });
  }

  public async completion({ query, chatId, username }: CompletionParams): Promise<AiResponse> {
    const formettedQuery = `[USERNAME]${username}[/USERNAME]: ${query}`;
    await this.threadManager.appendThread({ chatId, content: formettedQuery, role: 'user' });
    const thread = await this.threadManager.getThread(chatId);
    const prompt = await this.getPrompt({ aggressive: true });
    const { choices } = await this.client.agents.complete({
      agentId: this.env.MISTRAL_AGENT_ID,
      messages: [...prompt, ...thread],
      responseFormat: { type: 'json_object' },
    });

    const content = choices?.[0].message.content;
    if (typeof content === 'string') {
      await this.threadManager.appendThread({ chatId, role: 'assistant', content });
      const parsed = this.parseAiResponse(content);
      return parsed;
    } else {
      return {
        valid: false,
        raw: content?.toString() ?? 'null',
      };
    }
  }

  public async classifyImage(imageUrl: string): Promise<string> {
    const response = await this.client.chat.complete({
      model: 'pixtral-12b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Short list of tags to describe this ticker for future usage in prompt.' },
            {
              type: 'image_url',
              imageUrl,
            },
          ],
        },
      ],
    });
    const { content } = response.choices?.[0].message ?? {};
    return typeof content === 'string' ? content : '';
  }

  // private async classifyThread(thread: Thread): Promise<ConversationTraits> {
  //   try {
  //     const { results } = await this.client.classifiers.moderateChat({
  //       inputs: thread,
  //       model: 'mistral-moderation-latest',
  //     });
  //     await new Promise((resolve) => setTimeout(resolve, 500));

  //     const aggressive = Object.values(results?.[0].categoryScores ?? {}).some((x) => x > 0.1);

  //     return { aggressive };
  //   } catch (error: any) {
  //     if (error.status !== 429) {
  //       console.error('Error on classification request', error);
  //     }
  //     return { aggressive: false };
  //   }
  // }

  private async getPrompt(traits: ConversationTraits): Promise<Thread> {
    const dynamicPrompt = await this.promptManager.getPrompt();
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
    if (
      'gif' in response &&
      ((typeof response.gif !== 'string' && typeof response.gif !== 'number') || !response.gif)
    ) {
      return false;
    }
    if (!response.text && !response.sticker && !response.gif) {
      return false;
    }
    return true;
  }
}

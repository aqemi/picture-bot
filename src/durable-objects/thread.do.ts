import { DurableObject } from 'cloudflare:workers';
import { config } from '../bot/ai.config';
import { AiResponseTransformer } from '../bot/handlers/ai-response-transformer';
import { MistraleAgent } from '../bot/plugins/mistrale/mistrale-agent';
import { ResponseHelper } from '../bot/response-helper';
import { TelegramApi } from '../bot/telegram-api';
import { GifManager } from '../managers/gif.manager';
import { PromptManager } from '../managers/prompt.manager';
import { StickerManager } from '../managers/sticker.manager';
import { ThreadManager } from '../managers/thread.manager';
import { random } from '../utils/random';

type ThreadReplyPayloadCommon = {
  text: string;
  chatId: number;
  messageId: number;
  replyTo?: number;
  businessConnectionId?: string;
  chatTitle: string | null;
  displayErrors: boolean;
  rawFallback: boolean;
  postProcessing: boolean;
  debounce?: boolean;
};

type ThreadReplyPayload = ThreadReplyPayloadCommon & {};

type ThreadReplyDelayPayload = ThreadReplyPayloadCommon;

type ThreadObjectState = {
  chatId: number;
  businessConnectionId?: string;
  replyTo?: number;
  chatTitle: string | null;
  displayErrors: boolean;
  rawFallback: boolean;
  postProcessing: boolean;
  shouldRead?: boolean;
  messageId: number;
};

export class ThreadDurableObject extends DurableObject {
  readonly env: Env;
  private readonly api: TelegramApi;
  private readonly responseHelper: ResponseHelper;
  private readonly agent: MistraleAgent;
  private readonly threadManager: ThreadManager;
  private readonly promptManager: PromptManager;
  private state?: ThreadObjectState;
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.env = env;
    this.api = new TelegramApi(env.TG_TOKEN);
    this.responseHelper = new ResponseHelper(this.api, env);
    this.threadManager = new ThreadManager(env);
    this.promptManager = new PromptManager(env);
    this.agent = new MistraleAgent(env, this.promptManager);
  }

  public async reply({
    text,
    chatId,
    replyTo,
    messageId,
    businessConnectionId,
    chatTitle,
    displayErrors,
    rawFallback,
    postProcessing,
  }: ThreadReplyPayload): Promise<void> {
    this.state = {
      chatId,
      replyTo,
      messageId,
      businessConnectionId,
      chatTitle,
      displayErrors,
      rawFallback,
      postProcessing,
    };
    await this.threadManager.appendThread({ chatId, role: 'user', content: text });
    await this.alarm();
  }

  public async replyWithDelay({
    text,
    chatId,
    replyTo,
    businessConnectionId,
    chatTitle,
    displayErrors,
    rawFallback,
    postProcessing,
    messageId,
  }: ThreadReplyDelayPayload): Promise<void> {
    this.state = {
      chatId,
      replyTo,
      messageId,
      businessConnectionId,
      chatTitle,
      displayErrors,
      rawFallback,
      postProcessing,
    };

    await this.threadManager.appendThread({ chatId, role: 'user', content: text });
    const alarm = await this.ctx.storage.getAlarm();
    if (!alarm) {
      const isActive = await this.threadManager.isActive(chatId, config.staleness.business);
      if (isActive && businessConnectionId) {
        await this.readBusinessMessage(businessConnectionId, chatId, messageId);
      } else {
        this.state.shouldRead = true;
      }
      const delayConfig = isActive ? config.delay.read : config.delay.idle;
      const delay = random(delayConfig.min, delayConfig.max);
      await this.ctx.storage.put('state', this.state);
      await this.ctx.storage.setAlarm(Date.now() + delay);
    }
  }

  async alarm(): Promise<void> {
    const state = this.state ?? (await this.ctx.storage.get('state'));
    if (!state) {
      console.error('Missing state');
      return;
    }
    const {
      chatId,
      businessConnectionId,
      replyTo,
      chatTitle,
      displayErrors,
      rawFallback,
      postProcessing,
      messageId,
      shouldRead = false,
    } = state;
    try {
      if (shouldRead && businessConnectionId) {
        await this.readBusinessMessage(businessConnectionId, chatId, messageId);
        const delay = random(config.delay.read.min, config.delay.read.max);
        await this.sleep(delay);
      }
      const typingDuration = random(config.delay.typing.min, config.delay.typing.max);
      try {
        await this.api.sendChatAction({
          chat_id: chatId,
          business_connection_id: businessConnectionId,
          action: 'typing',
        });
      } catch (error) {
        console.error('Error on send typing', error);
      }
      const [response] = await Promise.all([this.runCompletion(chatId, chatTitle), this.sleep(typingDuration)]);
      const responseTransformer = new AiResponseTransformer(
        this.env,
        this.api,
        this.responseHelper,
        new StickerManager(this.api, this.env),
        new GifManager(this.env, new PromptManager(this.env)),
      );
      await responseTransformer.send(response, {
        chatId,
        replyTo,
        businessConnectionId,
        postProcessing,
        rawFallback,
      });
      await this.threadManager.appendThread({ chatId, role: 'assistant', content: response.raw });
    } catch (error) {
      console.error('Error in alarm', error);
      if (displayErrors) {
        await this.responseHelper.sendError(chatId, error, replyTo);
      }
    }
  }

  private async runCompletion(chatId: number, chatTitle: string | null) {
    const thread = await this.threadManager.getThread(chatId);
    const threadWithPrompt = chatTitle ? [this.promptManager.getChatPrompt(chatTitle), ...thread] : thread;
    return this.agent.completion(threadWithPrompt);
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async readBusinessMessage(bussinessConnectionId: string, chatId: number, messageId: number) {
    try {
      await this.api.readBusinessMessage({
        business_connection_id: bussinessConnectionId,
        chat_id: chatId,
        message_id: messageId,
      });
    } catch (error) {
      console.error('Error on readBusinessMessage', error);
    }
  }
}

export function getThreadObject(env: Env, name: string | number) {
  const objectId = env.THREAD.idFromName(name.toString());
  return env.THREAD.get(objectId);
}

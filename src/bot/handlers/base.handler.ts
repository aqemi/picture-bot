import type { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { ResponseHelper } from '../response-helper';
import type { TelegramApi } from '../telegram-api';

export abstract class TelegramUpdateHandler {
  constructor(
    protected readonly api: TelegramApi,
    protected readonly env: Env,
    protected readonly responseHelper: ResponseHelper,
  ) {}

  public abstract match(payload: TelegramUpdate): Promise<boolean>;

  public abstract handle(payload: TelegramUpdate): Promise<void>;
}

export type TelegramUpdateHandlerDerived = {
  new (api: TelegramApi, env: Env, responseHelper: ResponseHelper): TelegramUpdateHandler;
} & typeof TelegramUpdateHandler;

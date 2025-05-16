import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { GifManager } from '../../managers/gif.manager';
import { StickerManager } from '../../managers/sticker.manager';
import { PluginDerived } from '../plugins';
import { ResponseHelper } from '../response-helper';
import { TelegramApi } from '../telegram-api';
import { AiResponseTransformer, plugins } from './ai-response-transformer';

describe('AiResponseTransformer', () => {
  const mockEnv = {} as Env;
  const mockApi = {
    sendMessage: vi
      .fn()
      .mockResolvedValue({ result: { message_id: 1, text: 'Hello', from: { id: 456, username: 'bot' } } }),
    sendSticker: vi.fn(),
    sendAnimation: vi.fn(),
  } as unknown as TelegramApi;
  const mockResponseHelper = { sendJSON: vi.fn() } as unknown as ResponseHelper;
  const mockStickerManager = {
    getSticker: vi.fn().mockResolvedValue({ file_id: 'sticker_file_id' }),
  } as unknown as StickerManager;
  const mockGifManager = {
    getGif: vi.fn().mockResolvedValue({ file_id: 'gif_file_id' }),
  } as unknown as GifManager;

  let transformer: AiResponseTransformer;
  beforeEach(() => {
    vi.clearAllMocks();
    transformer = new AiResponseTransformer(mockEnv, mockApi, mockResponseHelper, mockStickerManager, mockGifManager);
  });

  describe('AiResponseTransformer send method', () => {
    it('should send raw JSON if response is invalid and rawFallback is true', async () => {
      const response = { valid: false, raw: 'Invalid response' };
      const options = { chatId: 123, rawFallback: true, postProcessing: false, replyTo: 456 };
      await transformer.send(response, options);

      expect(mockResponseHelper.sendJSON).toHaveBeenCalledWith(123, 'Invalid response', 456);
    });

    it('should send text message if response contains text', async () => {
      const transformer = new AiResponseTransformer(
        mockEnv,
        mockApi,
        mockResponseHelper,
        mockStickerManager,
        mockGifManager,
      );

      const response = { valid: true, text: 'Hello', raw: 'R' };
      const options = {
        chatId: 123,
        postProcessing: false,
        rawFallback: true,
        replyTo: 456,
        businessConnectionId: '123',
      };

      await transformer.send(response, options);

      expect(mockApi.sendMessage).toHaveBeenCalledWith({
        chat_id: 123,
        business_connection_id: '123',
        reply_to_message_id: 456,
        text: 'Hello',
      });
    });

    it('should send sticker if response contains a sticker', async () => {
      const response = { valid: true, text: 'P', sticker: '🎃', raw: 'R' };
      const options = {
        chatId: 123,
        postProcessing: false,
        rawFallback: true,
        replyTo: 456,
        businessConnectionId: '123',
      };
      (mockStickerManager.getSticker as MockedFunction<typeof mockStickerManager.getSticker>).mockResolvedValueOnce(
        null,
      );

      await transformer.send(response, options);

      expect(mockApi.sendSticker).not.toHaveBeenCalled();
      expect(mockApi.sendMessage).toHaveBeenCalledWith({ business_connection_id: '123', chat_id: 123, text: '🎃' });
    });

    it('should send sticker as a text if response contains an invalid sticker', async () => {
      const response = { valid: true, text: 'P', sticker: '🎃', raw: 'R' };
      const options = {
        chatId: 123,
        postProcessing: false,
        rawFallback: true,
        replyTo: 456,
        businessConnectionId: '123',
      };

      await transformer.send(response, options);

      expect(mockStickerManager.getSticker).toHaveBeenCalledWith('🎃');
      expect(mockApi.sendSticker).toHaveBeenCalledWith({
        chat_id: 123,
        business_connection_id: '123',
        sticker: 'sticker_file_id',
      });
    });

    it('should send GIF if response contains a gif', async () => {
      const response = { valid: true, text: 'P', gif: 1, raw: 'R' };
      const options = {
        chatId: 123,
        postProcessing: false,
        rawFallback: true,
        replyTo: 456,
        businessConnectionId: '123',
      };

      await transformer.send(response, options);

      expect(mockGifManager.getGif).toHaveBeenCalledWith(1);
      expect(mockApi.sendAnimation).toHaveBeenCalledWith({
        chat_id: 123,
        business_connection_id: '123',
        animation: 'gif_file_id',
      });
    });

    it('should perform post-processing if postProcessing is true', async () => {
      const response = { valid: true, text: 'Hello', raw: 'R' };
      const options = {
        chatId: 123,
        postProcessing: true,
        rawFallback: true,
        replyTo: 456,
        businessConnectionId: '123',
      };

      const matchMock = vi.fn().mockResolvedValue(true);
      const runMock = vi.fn();

      const MockPlugin = vi.fn().mockImplementation(function (ctx, api, env) {
        this.match = matchMock;
        this.run = runMock;
      });

      plugins.splice(0, plugins.length, MockPlugin as unknown as PluginDerived);

      await transformer.send(response, options);

      expect(MockPlugin).toHaveBeenCalledExactlyOnceWith(
        {
          businessConnectionId: '123',
          chatId: 123,
          initiatorId: 456,
          initiatorName: 'bot',
          messageId: 1,
          replyToId: 1,
          text: 'Hello',
        },
        mockApi,
        mockEnv,
        mockResponseHelper,
      );
      expect(matchMock).toHaveBeenCalledOnce();
      expect(runMock).toHaveBeenCalledOnce();
    });
  });
});

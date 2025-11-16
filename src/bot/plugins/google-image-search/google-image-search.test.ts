import { env, SELF } from 'cloudflare:test';
import { TelegramApi } from '../../telegram-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBotEndpoint } from '../../../utils';
import requestFixture from './fixtures/request.json';
import moarFixtire from './fixtures/moar.json';

const sendPhotoSpy = vi.spyOn(TelegramApi.prototype, 'sendPhoto').mockResolvedValue({
  ok: true,
  result: true,
});

describe('Google Image Search Plugin', () => {
  const url = `https://example.org${getBotEndpoint(env)}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return image', async () => {
    await SELF.fetch(url, {
      method: 'POST',
      body: JSON.stringify(requestFixture),
    });
    expect(sendPhotoSpy).toHaveBeenCalledExactlyOnceWith({
      chat_id: 777,
      disable_notification: true,
      photo: expect.any(String),
      reply_markup: {
        inline_keyboard: [
          [
            {
              callback_data: '{"0":0,"1":777}',
              text: 'del',
            },
            {
              callback_data: '{"0":1,"1":777,"2":"GoogleImageSearch","3":1}',
              text: 're:',
            },
            {
              callback_data: '{"0":2,"1":777,"2":"GoogleImageSearch","3":1}',
              text: 'moar!',
            },
          ],
        ],
      },
      reply_to_message_id: 0,
    });
  });

  it('should return next image', async () => {
    await SELF.fetch(url, {
      method: 'POST',
      body: JSON.stringify(moarFixtire),
    });
    expect(sendPhotoSpy).toHaveBeenCalledExactlyOnceWith({
      caption: '@username',
      chat_id: 777,
      disable_notification: true,
      photo: expect.any(String),
      reply_markup: {
        inline_keyboard: [
          [
            {
              callback_data: '{"0":0,"1":777}',
              text: 'del',
            },
            {
              callback_data: '{"0":1,"1":777,"2":"GoogleImageSearch","3":2}',
              text: 're:',
            },
            {
              callback_data: '{"0":2,"1":777,"2":"GoogleImageSearch","3":2}',
              text: 'moar!',
            },
          ],
        ],
      },
      reply_to_message_id: 0,
    });
  });
});

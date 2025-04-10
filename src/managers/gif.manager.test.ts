import { ChatCompletionResponse } from '@mistralai/mistralai/models/components';
import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { GifManager } from './gif.manager';
import { PromptManager } from './prompt.manager';

describe('GifManager', () => {
  let gifManager: GifManager;
  let spy: MockInstance;

  const mockPromptManager = {
    updateSystemPrompt: vi.fn(),
  } as unknown as PromptManager;

  beforeEach(() => {
    vi.clearAllMocks();
    gifManager = new GifManager(env, mockPromptManager);
    spy = vi.spyOn(gifManager['client']['chat'], 'complete').mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'tag1, tag2',
          },
        },
      ],
    } as ChatCompletionResponse);
  });

  describe('addGif', () => {
    it('should classify the image, add the gif to the database, and update the system prompt', async () => {
      const file_id = 'test-file-id';
      const url = 'https://example.com/image.jpg';

      const result = await gifManager.addGif(file_id, url);
      expect(spy).toHaveBeenCalledWith({
        model: 'pixtral-12b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Short, comma-separated list of tags to describe this ticker for future usage in prompt.',
              },
              {
                type: 'image_url',
                imageUrl: url,
              },
            ],
          },
        ],
      });

      expect(mockPromptManager.updateSystemPrompt).toHaveBeenCalledWith('gif', 'Доступные гифки:\n1 - tag1, tag2');
      expect(result).toBe('tag1, tag2');
    });
    it('should classify the image, add the gif to the database, and update the system prompt (duplicate)', async () => {
      await env.DB.prepare('INSERT INTO gifs (file_id, description) VALUES (?,?)').bind('test0', 'tag0').run();
      const file_id = 'test-file-id';
      const url = 'https://example.com/image.jpg';

      const result = await gifManager.addGif(file_id, url);
      expect(spy).toHaveBeenCalledWith({
        model: 'pixtral-12b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Short, comma-separated list of tags to describe this ticker for future usage in prompt.',
              },
              {
                type: 'image_url',
                imageUrl: url,
              },
            ],
          },
        ],
      });

      expect(mockPromptManager.updateSystemPrompt).toHaveBeenCalledWith(
        'gif',
        'Доступные гифки:\n1 - tag0\n2 - tag1, tag2',
      );
      expect(result).toBe('tag1, tag2');
    });
    it('should classify the image, add the gif to the database, and update the system prompt (2nd)', async () => {
      const file_id = 'test-file-id';
      await env.DB.prepare('INSERT INTO gifs (file_id, description) VALUES (?,?)').bind(file_id, 'tag0').run();
      const url = 'https://example.com/image.jpg';

      const result = await gifManager.addGif(file_id, url);
      expect(spy).toHaveBeenCalledWith({
        model: 'pixtral-12b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Short, comma-separated list of tags to describe this ticker for future usage in prompt.',
              },
              {
                type: 'image_url',
                imageUrl: url,
              },
            ],
          },
        ],
      });

      expect(mockPromptManager.updateSystemPrompt).toHaveBeenCalledWith('gif', 'Доступные гифки:\n1 - tag1, tag2');
      expect(result).toBe('tag1, tag2');
    });
  });

  describe('getGif', () => {
    it('should return the gif when it exists in the database', async () => {
      const gif = { id: 1, file_id: 'test-file-id', description: 'tag1, tag2' };
      await env.DB.prepare('INSERT INTO gifs (id, file_id, description) VALUES (?, ?, ?)')
        .bind(gif.id, gif.file_id, gif.description)
        .run();

      const result = await gifManager.getGif(gif.id);
      expect(result).toEqual(gif);
    });

    it('should return null when the gif does not exist in the database', async () => {
      const result = await gifManager.getGif(999);
      expect(result).toBeNull();
    });

    it('should handle string IDs and return the gif when it exists', async () => {
      const gif = { id: 2, file_id: 'test-file-id-2', description: 'tag3, tag4' };
      await env.DB.prepare('INSERT INTO gifs (id, file_id, description) VALUES (?, ?, ?)')
        .bind(gif.id, gif.file_id, gif.description)
        .run();

      const result = await gifManager.getGif('2');
      expect(result).toEqual(gif);
    });
  });
});

import { type Message } from 'node-telegram-bot-api';
import { afterEach, describe, expect, it, Mock, vi } from 'vitest';
import { TelegramApi } from '../telegram-api';
import { AiMessageInterpreter } from './ai-message-interpreter';

describe('AiMessageInterpreter', () => {
  const mockEnv = {
    BOT_USERNAME: 'bot_username',
    AI: {
      run: vi.fn(),
    },
  } as unknown as Env;

  const mockApi = {
    getFileBuffer: vi.fn().mockResolvedValue(Buffer.from('mocked buffer')),
  } as unknown as TelegramApi;

  const interpreter = new AiMessageInterpreter(mockEnv, mockApi);

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('formatMessage', () => {
    it('should format a text message correctly', async () => {
      const message: Message = {
        text: 'Hello, world!',
        from: { first_name: 'John', last_name: 'Doe', id: 1, is_bot: false },
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>John Doe</USERNAME>\nHello, world!');
    });

    it('should format a photo message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'A beautiful sunset.' });

      const message: Message = {
        photo: [
          {
            file_id: 'photo_file_id',
            file_unique_id: 'unique_id',
            file_size: 123,
            width: 0,
            height: 0,
          },
        ],
        caption: 'Look at this!',
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Jane</USERNAME>\n<PHOTO>\nA beautiful sunset.\nLook at this!\n</PHOTO>');
    });

    it('should handle decode image errors', async () => {
      (mockEnv.AI.run as Mock).mockRejectedValueOnce(new Error('test'));

      const message: Message = {
        photo: [
          {
            file_id: 'photo_file_id',
            file_unique_id: 'unique_id',
            file_size: 123,
            width: 0,
            height: 0,
          },
        ],
        caption: 'Look at this!',
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Jane</USERNAME>\n<PHOTO>\n\nLook at this!\n</PHOTO>');
    });

    it('should format a voice message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ text: 'Transcribed audio text.' });

      const message: Message = {
        voice: { file_id: 'voice_file_id', file_unique_id: 'unique_id', duration: 10 },
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        chat: { id: 3, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Alice</USERNAME>\n<VOICE_MESSAGE>Transcribed audio text.</VOICE_MESSAGE>');
    });

    it('should handle decode voice errors', async () => {
      (mockEnv.AI.run as Mock).mockRejectedValueOnce(new Error('test'));

      const message: Message = {
        voice: { file_id: 'voice_file_id', file_unique_id: 'unique_id', duration: 10 },
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        chat: { id: 3, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Alice</USERNAME>\n<VOICE_MESSAGE/>');
    });

    it('should handle an unsupported message type gracefully', async () => {
      const message: Message = {
        from: { first_name: 'Bob', id: 4, is_bot: false },
        message_id: 4,
        chat: { id: 4, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Bob</USERNAME>\n<NOT_PARSED_TEXT/>');
    });

    it('should format a video message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'A beautiful sunset.' });
      const message: Message = {
        video: {
          file_id: 'video_file_id',
          file_unique_id: 'unique_id',
          duration: 20,
          width: 640,
          height: 480,
          file_name: 'video.mp4',
          thumb: {
            file_id: 'thumb_file_id',
            file_unique_id: 'unique_id',
            width: 320,
            height: 240,
            file_size: 12345,
          },
        },
        caption: 'Check this out!',
        from: { first_name: 'Charlie', id: 5, is_bot: false },
        message_id: 5,
        chat: { id: 5, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>Charlie</USERNAME>\n<VIDEO>\nA beautiful sunset.\nFilename:video.mp4\nCheck this out!\n</VIDEO>',
      );
    });

    it('should format a document message correctly', async () => {
      const message: Message = {
        document: {
          file_id: 'doc_file_id',
          file_unique_id: 'unique_id',
          file_name: 'example.pdf',
          mime_type: 'application/pdf',
        },
        from: { first_name: 'Diana', id: 6, is_bot: false },
        message_id: 6,
        chat: { id: 6, type: 'private' },
        date: 1234567890,
        caption: 'This is a sample document caption.',
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>Diana</USERNAME>\n<FILE>\nFilename:example.pdf\nThis is a sample document caption.\n</FILE>',
      );
    });

    it('should format a sticker message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'A beautiful sunset.' });
      const message: Message = {
        sticker: {
          file_id: 'sticker_file_id',
          file_unique_id: 'unique_id',
          emoji: '😊',
          type: 'regular',
          is_animated: false,
          is_video: false,
          width: 512,
          height: 512,
          set_name: 'abc',
        },
        from: { first_name: 'Eve', id: 7, is_bot: false },
        message_id: 7,
        chat: { id: 7, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Eve</USERNAME>\n<STICKER>\nA beautiful sunset.\nabc - 😊\n</STICKER>');
    });

    it('should format an audio message correctly', async () => {
      const message: Message = {
        audio: {
          file_id: 'audio_file_id',
          file_unique_id: 'unique_id',
          duration: 30,
          title: 'Sample Audio',
          performer: 'John Doe',
          mime_type: 'audio/mpeg',
          file_name: 'audio.mp3',
        },
        caption: 'This is a sample audio caption.',
        from: { first_name: 'Frank', id: 8, is_bot: false },
        message_id: 8,
        chat: { id: 8, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>Frank</USERNAME>\n<AUDIO>\nFilename:audio.mp3\nJohn Doe - Sample Audio\nThis is a sample audio caption.\n</AUDIO>',
      );
    });

    it('should format an animation message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'A beautiful sunset.' });
      const message: Message = {
        animation: {
          file_id: 'animation_file_id',
          file_unique_id: 'unique_id',
          width: 480,
          height: 360,
          duration: 10,
          file_name: 'animation.mp4',
          thumb: {
            file_id: 'thumb_file_id',
            file_unique_id: 'unique_id',
            width: 240,
            height: 180,
            file_size: 12345,
          },
        },
        from: { first_name: 'Grace', id: 9, is_bot: false },
        message_id: 9,
        chat: { id: 9, type: 'private' },
        date: 1234567890,
        caption: 'This is an animation caption.',
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>Grace</USERNAME>\n<GIF>\nA beautiful sunset.\nFilename:animation.mp4\nThis is an animation caption.\n</GIF>',
      );
    });

    it('should format a contact message correctly', async () => {
      const message: Message = {
        contact: { phone_number: '+1234567890', first_name: 'Hank', last_name: 'Smith', user_id: 10 },
        from: { first_name: 'Hank', id: 10, is_bot: false },
        message_id: 10,
        chat: { id: 10, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Hank</USERNAME>\n<CONTACT>Hank Smith: +1234567890</CONTACT>');
    });

    it('should format a location message correctly', async () => {
      const message: Message = {
        location: { latitude: 37.7749, longitude: -122.4194 },
        from: { first_name: 'Ivy', id: 11, is_bot: false },
        message_id: 11,
        chat: { id: 11, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Ivy</USERNAME>\n<LOCATION>Latitude: 37.7749, Longitude: -122.4194</LOCATION>');
    });

    it('should format a poll message correctly', async () => {
      const message: Message = {
        poll: {
          id: 'poll_id',
          question: 'What is your favorite color?',
          options: [
            { text: 'Red', voter_count: 10 },
            { text: 'Blue', voter_count: 20 },
          ],
          total_voter_count: 30,
          is_closed: false,
          is_anonymous: true,
          allows_multiple_answers: false,
          type: 'regular',
        },
        from: { first_name: 'Jack', id: 12, is_bot: false },
        message_id: 12,
        chat: { id: 12, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Jack</USERNAME>\n<POLL>\nWhat is your favorite color?\n - Red\n - Blue\n</POLL>');
    });

    it('should format a game message correctly', async () => {
      const message: Message = {
        game: {
          title: 'Chess',
          description: 'A classic game of strategy.',
          text: 'Chess is a two-player strategy board game played on an 8x8 grid.',
          photo: [
            {
              file_id: 'game_photo_id',
              file_unique_id: 'unique_id',
              width: 640,
              height: 480,
            },
          ],
        },
        from: { first_name: 'Kate', id: 13, is_bot: false },
        message_id: 13,
        chat: { id: 13, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>Kate</USERNAME>\n<GAME>\nChess\nA classic game of strategy.\nChess is a two-player strategy board game played on an 8x8 grid.\n</GAME>',
      );
    });

    it('should format a dice message correctly', async () => {
      const message: Message = {
        dice: { emoji: '🎲', value: 5 },
        from: { first_name: 'Leo', id: 14, is_bot: false },
        message_id: 14,
        chat: { id: 14, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Leo</USERNAME>\n<DICE>🎲: 5</DICE>');
    });

    it('should format a venue message correctly', async () => {
      const message: Message = {
        venue: {
          title: 'Central Park',
          address: 'New York, NY',
          location: { latitude: 40.785091, longitude: -73.968285 },
        },
        from: { first_name: 'Mia', id: 15, is_bot: false },
        message_id: 15,
        chat: { id: 15, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Mia</USERNAME>\n<VENUE>Central Park - New York, NY</VENUE>');
    });

    it('should format a story message correctly', async () => {
      const message: Message = {
        story: {},
        from: { first_name: 'Nina', id: 16, is_bot: false },
        message_id: 16,
        chat: { id: 16, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Nina</USERNAME>\n<STORY/>');
    });

    it('should format a paid media message correctly', async () => {
      const message: Message = {
        paid_media: {
          type: 'paid',
          file_id: 'paid_media_file_id',
          file_unique_id: 'unique_id',
          duration: 15,
          width: 1280,
          height: 720,
        },
        from: { first_name: 'Olivia', id: 17, is_bot: false },
        message_id: 17,
        chat: { id: 17, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Olivia</USERNAME>\n<PAID_MEDIA/>');
    });

    it('should handle video note messages correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'A beautiful sunset.' });
      const message: Message = {
        video_note: {
          file_id: 'video_note_file_id',
          file_unique_id: 'unique_id',
          duration: 10,
          length: 240,
          thumb: {
            file_id: 'thumb_file_id',
            file_unique_id: 'unique_id',
            width: 240,
            height: 180,
          },
        },
        from: { first_name: 'Seele', id: 18, is_bot: false },
        message_id: 18,
        chat: { id: 18, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe('<USERNAME>Seele</USERNAME>\n<VIDEO_MESSAGE>A beautiful sunset.</VIDEO_MESSAGE>');
    });
    it('should format a gift message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'Gift sticker description.' });
      const message: Message = {
        gift: {
          gift: {
            id: 'gift_id',
            star_count: 100,
            sticker: {
              file_id: 'gift_sticker_file_id',
              file_unique_id: 'unique_id',
              width: 512,
              height: 512,
              is_animated: false,
              is_video: false,
              type: 'custom_emoji',
            },
          },
        },
        text: 'Happy Birthday!',
        from: { first_name: 'GiftGiver', id: 21, is_bot: false },
        message_id: 21,
        chat: { id: 21, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>GiftGiver</USERNAME>\n<GIFT>\nGift sticker description.\nHappy Birthday!\n</GIFT>',
      );
    });

    it('should format a unique_gift message correctly', async () => {
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: 'Unique gift sticker description.' });
      const message: Message = {
        unique_gift: {
          origin: 'transfer',
          gift: {
            base_name: 'unique_gift',
            name: 'Unique Gift',
            number: 1,
            backdrop: {
              name: 'Unique Backdrop',
              colors: {
                center_color: 123456,
                edge_color: 654321,
                symbol_color: 111111,
                text_color: 222222,
              },
              rarity_per_mille: 100,
            },
            symbol: {
              name: 'Unique Symbol',
              rarity_per_mille: 100,
              sticker: {
                file_id: 'unique_symbol_sticker_file_id',
                file_unique_id: 'unique_id',
                width: 512,
                height: 512,
                is_animated: false,
                is_video: false,
                type: 'regular',
              },
            },
            model: {
              name: 'Unique Gift',
              rarity_per_mille: 100,
              sticker: {
                file_id: 'unique_gift_sticker_file_id',
                file_unique_id: 'unique_id',
                width: 512,
                height: 512,
                is_animated: false,
                is_video: false,
                type: 'regular',
              },
            },
          },
        },
        text: 'Congrats!',
        from: { first_name: 'GiftGiver', id: 22, is_bot: false },
        message_id: 22,
        chat: { id: 22, type: 'private' },
        date: 1234567890,
      };

      const result = await interpreter.formatMessage(message);

      expect(result).toBe(
        '<USERNAME>GiftGiver</USERNAME>\n<GIFT>\nUnique gift sticker description.\nCongrats!\n</GIFT>',
      );
    });
  });

  it('should return the reply_to_message ID if present', async () => {
    const message: Message = {
      message_id: 20,
      chat: { id: 20, type: 'private' },
      date: 1234567890,
      reply_to_message: { message_id: 15, chat: { id: 20, type: 'private' }, date: 1234567890 },
      from: { first_name: 'John', id: 20, is_bot: false },
    };

    const result = interpreter.getReplyToId(message);

    expect(result).toBe(20);
  });
  describe('extractText', () => {
    it('should return the text of a message if present', () => {
      const message: Message = {
        text: 'Hello, world!',
        from: { first_name: 'John', id: 1, is_bot: false },
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.extractText(message);

      expect(result).toBe('Hello, world!');
    });

    it('should return the caption of a message if text is not present', () => {
      const message: Message = {
        caption: 'This is a caption.',
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.extractText(message);

      expect(result).toBe('This is a caption.');
    });

    it('should return an empty string if neither text nor caption is present', () => {
      const message: Message = {
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        chat: { id: 3, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.extractText(message);

      expect(result).toBe('');
    });
  });
  describe('isMentioned', () => {
    it('should return true if the bot is mentioned in the message text', () => {
      const message: Message = {
        text: '@bot_username_bot Hello!',
        from: { first_name: 'John', id: 1, is_bot: false },
        message_id: 1,
        chat: { id: 1, type: 'group' },
        date: 1234567890,
      };

      const result = interpreter.isMentioned(message);

      expect(result).toBe(true);
    });

    it('should return false if the bot is not mentioned in the message text', () => {
      const message: Message = {
        text: 'Hello!',
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isMentioned(message);

      expect(result).toBe(false);
    });

    it('should return false if the message text is empty', () => {
      const message: Message = {
        text: '',
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        chat: { id: 3, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isMentioned(message);

      expect(result).toBe(false);
    });
  });
  describe('decodeImage', () => {
    it('should return a description when the AI service successfully processes the image', async () => {
      const mockFileBuffer = Buffer.from('mocked buffer');
      const mockDescription = 'A beautiful sunset.';
      (mockApi.getFileBuffer as Mock).mockResolvedValueOnce(mockFileBuffer);
      (mockEnv.AI.run as Mock).mockResolvedValueOnce({ description: mockDescription });

      const result = await interpreter['decodeImage']('test_file_id');

      expect(mockApi.getFileBuffer).toHaveBeenCalledWith({ file_id: 'test_file_id' });
      expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/llava-hf/llava-1.5-7b-hf', {
        image: [...new Uint8Array(mockFileBuffer)],
        prompt: 'Generate a caption for this image in russian.',
        max_tokens: 512,
      });
      expect(result).toBe(mockDescription);
    });

    it('should return an empty string if the AI service fails', async () => {
      const mockFileBuffer = Buffer.from('mocked buffer');
      (mockApi.getFileBuffer as Mock).mockResolvedValueOnce(mockFileBuffer);
      (mockEnv.AI.run as Mock).mockRejectedValueOnce(new Error('AI service error'));

      const result = await interpreter['decodeImage']('test_file_id');

      expect(mockApi.getFileBuffer).toHaveBeenCalledWith({ file_id: 'test_file_id' });
      expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/llava-hf/llava-1.5-7b-hf', {
        image: [...new Uint8Array(mockFileBuffer)],
        prompt: 'Generate a caption for this image in russian.',
        max_tokens: 512,
      });
      expect(result).toBe('');
    });

    it('should return an empty string if fetching the file buffer fails', async () => {
      (mockApi.getFileBuffer as Mock).mockRejectedValueOnce(new Error('File buffer error'));

      const result = await interpreter['decodeImage']('test_file_id');

      expect(mockApi.getFileBuffer).toHaveBeenCalledWith({ file_id: 'test_file_id' });
      expect(mockEnv.AI.run).not.toHaveBeenCalled();
      expect(result).toBe('');
    });
  });
  describe('getFullname', () => {
    it('should return the full name when both first and last names are present', () => {
      const message: Message = {
        from: { first_name: 'John', last_name: 'Doe', id: 1, is_bot: false },
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.getFullname(message);

      expect(result).toBe('John Doe');
    });

    it('should return only the first name when the last name is not present', () => {
      const message: Message = {
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.getFullname(message);

      expect(result).toBe('Jane');
    });
  });
  describe('getChatTitle', () => {
    it('should return the title for a group chat', () => {
      const message: Message = {
        chat: { id: 1, type: 'group', title: 'Group Chat' },
        from: { first_name: 'John', id: 1, is_bot: false },
        message_id: 1,
        date: 1234567890,
      };

      const result = interpreter.getChatTitle(message);

      expect(result).toBe('Group Chat');
    });

    it('should return the title for a supergroup chat', () => {
      const message: Message = {
        chat: { id: 2, type: 'supergroup', title: 'Supergroup Chat' },
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        date: 1234567890,
      };

      const result = interpreter.getChatTitle(message);

      expect(result).toBe('Supergroup Chat');
    });

    it('should return null for a private chat', () => {
      const message: Message = {
        chat: { id: 3, type: 'private' },
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        date: 1234567890,
      };

      const result = interpreter.getChatTitle(message);

      expect(result).toBeNull();
    });

    it('should return null for a channel chat', () => {
      const message: Message = {
        chat: { id: 4, type: 'channel', title: 'Channel Chat' },
        from: { first_name: 'Bob', id: 4, is_bot: false },
        message_id: 4,
        date: 1234567890,
      };

      const result = interpreter.getChatTitle(message);

      expect(result).toBeNull();
    });
  });
  describe('isReplyToOther', () => {
    it('should return true if the message is a reply to another user', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        reply_to_message: {
          message_id: 2,
          from: { username: 'other_user', id: 2, is_bot: false, first_name: 'Other' },
          chat: { id: 1, type: 'private' },
          date: 1234567890,
        },
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToOther(message);

      expect(result).toBe(true);
    });

    it('should return false if the message is a reply to the bot', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        reply_to_message: {
          message_id: 2,
          from: { username: 'bot_username_bot', id: 2, is_bot: true, first_name: 'Bot' },
          chat: { id: 1, type: 'private' },
          date: 1234567890,
        },
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToOther(message);

      expect(result).toBe(false);
    });

    it('should return false if the message is not a reply to any message', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToOther(message);

      expect(result).toBe(false);
    });
  });
  describe('isCalled', () => {
    it('should return true if the message text matches the bot mention tag', () => {
      const message: Message = {
        text: '@bot_username_bot',
        from: { first_name: 'John', id: 1, is_bot: false },
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isCalled(message);

      expect(result).toBe(true);
    });

    it('should return false if the message text does not match the bot mention tag', () => {
      const message: Message = {
        text: 'Hello @bot_username_bot',
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isCalled(message);

      expect(result).toBe(false);
    });

    it('should return false if the message text is empty', () => {
      const message: Message = {
        text: '',
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        chat: { id: 3, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isCalled(message);

      expect(result).toBe(false);
    });

    it('should return true if the message caption matches the bot mention tag', () => {
      const message: Message = {
        caption: '@bot_username_bot',
        from: { first_name: 'Bob', id: 4, is_bot: false },
        message_id: 4,
        chat: { id: 4, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isCalled(message);

      expect(result).toBe(true);
    });

    it('should return false if neither text nor caption matches the bot mention tag', () => {
      const message: Message = {
        caption: 'Some caption',
        from: { first_name: 'Eve', id: 5, is_bot: false },
        message_id: 5,
        chat: { id: 5, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isCalled(message);

      expect(result).toBe(false);
    });
  });
  describe('isReplyToMe', () => {
    it('should return true if the message is a reply to the bot', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        reply_to_message: {
          message_id: 2,
          from: { username: 'bot_username_bot', id: 2, is_bot: true, first_name: 'Bot' },
          chat: { id: 1, type: 'private' },
          date: 1234567890,
        },
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToMe(message);

      expect(result).toBe(true);
    });

    it('should return false if the message is a reply to another user', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        reply_to_message: {
          message_id: 2,
          from: { username: 'other_user', id: 3, is_bot: false, first_name: 'Other' },
          chat: { id: 1, type: 'private' },
          date: 1234567890,
        },
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToMe(message);

      expect(result).toBe(false);
    });

    it('should return false if the message is not a reply to any message', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToMe(message);

      expect(result).toBe(false);
    });

    it('should return false if reply_to_message exists but has no from field', () => {
      const message: Message = {
        message_id: 1,
        chat: { id: 1, type: 'private' },
        date: 1234567890,
        reply_to_message: {
          message_id: 2,
          chat: { id: 1, type: 'private' },
          date: 1234567890,
        },
        from: { first_name: 'John', id: 1, is_bot: false },
      };

      const result = interpreter.isReplyToMe(message);

      expect(result).toBe(false);
    });
  });
  describe('isOtherMentioned', () => {
    it('should return true if another user is mentioned and the bot is not mentioned', () => {
      const message: Message = {
        text: '@otheruser Hello!',
        from: { first_name: 'John', id: 1, is_bot: false },
        message_id: 1,
        chat: { id: 1, type: 'group' },
        date: 1234567890,
      };

      const result = interpreter.isOtherMentioned(message);

      expect(result).toBe(true);
    });

    it('should return false if the bot is mentioned', () => {
      const message: Message = {
        text: '@bot_username_bot Hello!',
        from: { first_name: 'Jane', id: 2, is_bot: false },
        message_id: 2,
        chat: { id: 2, type: 'group' },
        date: 1234567890,
      };

      const result = interpreter.isOtherMentioned(message);

      expect(result).toBe(false);
    });

    it('should return false if no mention is present', () => {
      const message: Message = {
        text: 'Hello!',
        from: { first_name: 'Alice', id: 3, is_bot: false },
        message_id: 3,
        chat: { id: 3, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isOtherMentioned(message);

      expect(result).toBe(false);
    });

    it('should return false if text is empty', () => {
      const message: Message = {
        text: '',
        from: { first_name: 'Bob', id: 4, is_bot: false },
        message_id: 4,
        chat: { id: 4, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isOtherMentioned(message);

      expect(result).toBe(false);
    });

    it('should return true if mention is in caption and bot is not mentioned', () => {
      const message: Message = {
        caption: '@someone Check this out!',
        from: { first_name: 'Eve', id: 5, is_bot: false },
        message_id: 5,
        chat: { id: 5, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isOtherMentioned(message);

      expect(result).toBe(true);
    });

    it('should return false if mention is in caption and bot is mentioned', () => {
      const message: Message = {
        caption: '@bot_username_bot Check this out!',
        from: { first_name: 'Frank', id: 6, is_bot: false },
        message_id: 6,
        chat: { id: 6, type: 'private' },
        date: 1234567890,
      };

      const result = interpreter.isOtherMentioned(message);

      expect(result).toBe(false);
    });
  });
});

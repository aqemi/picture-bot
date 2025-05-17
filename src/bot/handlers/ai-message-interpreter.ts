import { type Message } from 'node-telegram-bot-api';
import { getBotMentionTag, getBotUsername } from '../../utils';
import { TelegramApi } from '../telegram-api';

export class AiMessageInterpreter {
  constructor(
    private readonly env: Env,
    private readonly api: TelegramApi,
  ) {}

  public async formatMessage(message: Message): Promise<string | null> {
    if ((message.media_group_id && !message.text) || message.message_auto_delete_timer_changed) {
      return null;
    }

    const content = await this.convertContentToText(message);
    // const replyContent = message.reply_to_message ? await this.contentToText(message.reply_to_message) : null;
    // return `${this.encloseInTags('USERNAME', this.getFullname(message))}${replyContent ? this.encloseInTags('REPLY', replyContent) : ''} ${content}`;
    return `${this.encloseInTags('USERNAME', this.getFullname(message))}\n${content}`;
  }

  private async convertContentToText(message: Message): Promise<string> {
    if (message.gift) {
      const decoded = await this.decodeImage(message.gift.gift.sticker.file_id);
      const giftDescription = `\n${decoded}\n${message.text}\n`;
      return this.encloseInTags('GIFT', giftDescription);
    }

    if (message.unique_gift) {
      const decoded = await this.decodeImage(message.unique_gift.gift.model.sticker.file_id);
      const giftDescription = `\n${decoded}\n${message.text}\n`;
      return this.encloseInTags('GIFT', giftDescription);
    }

    if (message.text) {
      return message.text;
    }
    if (message.animation) {
      const decoded = message.animation.thumb ? await this.decodeImage(message.animation.thumb.file_id) : '';
      const animationDescription = `\n${decoded}\nFilename:${message.animation.file_name}\n${message.caption ?? ''}\n`;
      return this.encloseInTags('GIF', animationDescription);
    }
    if (message.audio) {
      const audioDescription = `\nFilename:${message.audio.file_name}\n${message.audio.performer ?? ''} - ${message.audio.title ?? ''}\n${message.caption ?? ''}\n`;
      return this.encloseInTags('AUDIO', audioDescription);
    }
    if (message.document) {
      const documentDescription = `\nFilename:${message.document.file_name}\n${message.caption ?? ''}\n`;
      return this.encloseInTags('FILE', documentDescription);
    }
    if (message.paid_media) {
      return this.encloseInTags('PAID_MEDIA', message.caption);
    }
    if (message.photo) {
      const decoded = await this.decodeImage(message.photo[0].file_id);
      const photoDescription = `\n${decoded}\n${message.caption ?? ''}\n`;
      return this.encloseInTags('PHOTO', photoDescription);
    }
    if (message.sticker) {
      const decoded = await this.decodeImage(message.sticker.file_id);
      const stickerDescription = `\n${decoded}\n${message.sticker.set_name ?? ''} - ${message.sticker.emoji}\n`;
      return this.encloseInTags('STICKER', stickerDescription);
    }
    if (message.story) {
      return this.encloseInTags('STORY');
    }
    if (message.video) {
      const decoded = message.video.thumb ? await this.decodeImage(message.video.thumb.file_id) : '';
      const videoDescription = `\n${decoded}\nFilename:${message.video.file_name}\n${message.caption ?? ''}\n`;
      return this.encloseInTags('VIDEO', videoDescription);
    }
    if (message.video_note) {
      const decoded = message.video_note.thumb ? await this.decodeImage(message.video_note.thumb.file_id) : '';
      const videoNoteDescription = `${decoded}`;
      return this.encloseInTags('VIDEO_MESSAGE', videoNoteDescription);
    }
    if (message.voice) {
      const decoded = await this.decodeAudio(message.voice.file_id);
      return this.encloseInTags('VOICE_MESSAGE', decoded);
    }
    if (message.contact) {
      const contactDescription = `${message.contact.first_name} ${message.contact.last_name ?? ''}: ${message.contact.phone_number}`;
      return this.encloseInTags('CONTACT', contactDescription);
    }
    if (message.dice) {
      const diceDescription = `${message.dice.emoji}: ${message.dice.value}`;
      return this.encloseInTags('DICE', diceDescription);
    }
    if (message.game) {
      const gameDescription = `\n${message.game.title}\n${message.game.description}\n${message.game.text ?? ''}\n`;
      return this.encloseInTags('GAME', gameDescription);
    }
    if (message.poll) {
      const pollDescription = `\n${message.poll.question}\n - ${message.poll.options.map((x) => x.text).join('\n - ')}\n`;
      return this.encloseInTags('POLL', pollDescription);
    }
    if (message.venue) {
      const venueDescription = `${message.venue.title} - ${message.venue.address}`;
      return this.encloseInTags('VENUE', venueDescription);
    }
    if (message.location) {
      const locationDescription = `Latitude: ${message.location.latitude}, Longitude: ${message.location.longitude}`;
      return this.encloseInTags('LOCATION', locationDescription);
    }

    return this.encloseInTags('NOT_PARSED_TEXT');
  }

  public getReplyToId(message: Message): number | null {
    return message.message_id;
    // return this.isCalled(message) && message.reply_to_message
    //   ? message.reply_to_message.message_id
    //   : message.message_id;
  }

  public extractText(message: Message): string {
    return message.text ?? message.caption ?? '';
  }

  private encloseInTags(tag: string, content?: string) {
    if (!content) {
      return `<${tag}/>`;
    }
    return `<${tag}>${content}</${tag}>`;
  }

  public isCalled(message: Message) {
    return this.extractText(message) === getBotMentionTag(this.env);
  }

  public isMentioned(message: Message): boolean {
    const text = this.extractText(message);
    return text.includes(getBotMentionTag(this.env)) ?? false;
  }

  public isReplyToMe(message: Message): boolean {
    return message.reply_to_message?.from?.username === getBotUsername(this.env);
  }

  public isOtherMentioned(message: Message): boolean {
    const text = this.extractText(message);
    return /@\w/.test(text ?? '') && !this.isMentioned(message);
  }

  public isReplyToOther(message: Message): boolean {
    return !!message.reply_to_message && message.reply_to_message.from?.username !== getBotUsername(this.env);
  }

  public getChatTitle(message: Message): string | null {
    return message.chat.type === 'group' || message.chat.type === 'supergroup' ? message.chat.title! : null;
  }

  public getFullname(message: Message): string {
    return `${message.from?.first_name}${message.from?.last_name ? ` ${message.from.last_name}` : ''}`;
  }

  private async decodeImage(file_id: string): Promise<string> {
    try {
      const buffer = await this.api.getFileBuffer({ file_id });
      const input = {
        image: [...new Uint8Array(buffer)],
        prompt: 'Generate a caption for this image in russian.',
        max_tokens: 512,
      };
      const response = await this.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', input);
      return response.description;
    } catch (error) {
      console.error('Error on decode image', error);
      return '';
    }
  }

  private async decodeAudio(file_id: string): Promise<string> {
    try {
      const buffer = await this.api.getFileBuffer({ file_id });
      const input = {
        audio: [...new Uint8Array(buffer)],
      };

      const response = await this.env.AI.run('@cf/openai/whisper-tiny-en', input);
      return response.text;
    } catch (error) {
      console.error('Error on decode audio', error);
      return '';
    }
  }
}

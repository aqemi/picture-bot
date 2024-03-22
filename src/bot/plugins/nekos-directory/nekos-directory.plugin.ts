import { Plugin } from '../base.plugin';

const NEKOS_TAGS: string[] = [
  'kiss', //	Kissing images
  'lick', //	Lick
  'hug', //	Give someone a hug
  'baka', //	B-Baka!!!
  'cry', //	:,(
  'poke', //	Senpai notice meeeee!
  'smug', //	What to put here?
  'slap', //	Ope
  'tickle', //	;)
  'pat', //	Pat someone
  'laugh', //	HaHaHaHa
  'feed', //	I want foooooodddddd
  'cuddle', //	well in this context.... An intesnse hug
  '4k', //	Real 4K images (mostly 4k but all uhd)
  'ass', //	Reall Asses
  'blowjob', ///BJ	d-do I need to explain >///< (anime)
  'boobs', //	Real breasts
  'cum', //	Baby gravy!
  'feet', //	:eyes:
  'hentai', //	random hentai
  'wallpapers', //	99% sfw
  'spank', //	NSFW for butts
  'gasm', //	aheago
  'lesbian', //	girls rule!
  'lewd', //	**WARNING** this folder is unsorted I would not use it untill weve filtered out loli/shota content
  'pussy', //	u-ummm >///<
];

export class NekosDirectory extends Plugin {
  public async processAndRespond(): Promise<void> {
    const commands = NEKOS_TAGS.map((x) => `/nekos_${x}`).join('\n');
    await this.api.sendMessage({
      chat_id: this.ctx.chatId,
      reply_to_message_id: this.ctx.replyTo,
      text: commands
    });
  }
}

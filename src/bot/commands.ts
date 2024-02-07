import { GoogleImageSearch, Youtube, Tenor, Keyboard, Context, Plugin, Test } from './plugins';

type PluginDerived = { new (ctx: Context): Plugin } & typeof Plugin;

export const commands: [RegExp, PluginDerived][] = [
  [/^(?:пик|пикча|img|image|pic|picture)(?: (.+))?$/i, GoogleImageSearch],
  [/^(?:видео|video|youtube|ютуб)(?: (.+))?$/i, Youtube],
  [/^(?:gif|гиф|гифка)(?: (.+))?$/i, Tenor],
  [/^амикей даун/iu, Keyboard],
  [/^test (\d+)$/i, Test],
];

export const directlyInvokedPlugins: PluginDerived[] = [GoogleImageSearch, Youtube, Tenor];

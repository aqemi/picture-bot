export function getStickerSets(env: Env): string[] {
  if(!env.STICKER_SETS) {
    return [];
  }
  return env.STICKER_SETS.split(',').map((x) => x.trim()) ?? [];
}

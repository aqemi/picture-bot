export function random(from: number, to: number) {
  if (from > to) {
    throw new Error("The 'from' value must be less than or equal to the 'to' value.");
  }
  return Math.floor(Math.random() * (to - from + 1)) + from;
}

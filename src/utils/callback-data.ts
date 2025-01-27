export enum ResponseCallbackType {
  Delete,
  Retry,
  More,
}

export class ResponseCallbackData {
  constructor(
    public type: ResponseCallbackType,
    public ownerId: number,
    public plugin?: string,
    public resultNumber?: number,
  ) {}
}

type MinifiedResponseCallbackData = Record<number, number>;

const dummyData = new ResponseCallbackData(0, 0);
const minifiedKeysDict = Object.keys(dummyData).reduce(
  (dict, original, index) => ({ ...dict, [original]: index }),
  {} as Record<string, number>,
);
const responseCallbackKeysDict = Object.entries(minifiedKeysDict).reduce(
  (dict, [original, minified]) => ({ ...dict, [minified]: original }),
  {} as Record<number, string>,
);

function minifyCallbackData(data: ResponseCallbackData): MinifiedResponseCallbackData {
  return Object.entries(data).reduce((acc, [key, value]) => ({ ...acc, [minifiedKeysDict[key]]: value }), {});
}

function expandCallbackData(data: MinifiedResponseCallbackData): ResponseCallbackData {
  return Object.entries(data).reduce(
    (acc, [key, value]) => ({ ...acc, [responseCallbackKeysDict[Number(key)]]: value }),
    {} as ResponseCallbackData,
  );
}

export function parse(data: string): ResponseCallbackData {
  let parsed: MinifiedResponseCallbackData;
  try {
    parsed = JSON.parse(data);
  } catch (err: unknown) {
    throw new Error('Invalid JSON in callback_data');
  }
  return expandCallbackData(parsed);
}

export function stringify(data: ResponseCallbackData): string {
  const minified = minifyCallbackData(data);
  const json = JSON.stringify(minified);
  if (byteSize(json) > 64) {
    throw new Error(`Callback json ${json} exceeds 64 bytes`);
  }
  return json;
}

function byteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

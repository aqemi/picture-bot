interface ResponseCallbackDataMinified {
  n: number;
  t: string;
}

export interface ResponseCallbackData {
  resultNumber: number;
  type: string;
}

export function parse(data: string): ResponseCallbackData {
  let parsed: ResponseCallbackDataMinified;
  try {
    parsed = JSON.parse(data);
  } catch (err: any) {
    throw new Error('Invalid JSON in callback_data');
  }
  return {
    resultNumber: parsed.n,
    type: parsed.t,
  };
}

export function stringify(data: ResponseCallbackData): string {
  const minified: ResponseCallbackDataMinified = {
    n: data.resultNumber,
    t: data.type,
  };
  const json = JSON.stringify(minified);
  if (byteSize(json) > 64) {
    throw new Error(`Callback json ${json} exceeds 64 bytes`);
  }
  return json;
}

function byteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

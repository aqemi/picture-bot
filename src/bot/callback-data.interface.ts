export enum ResponseCallbackType {
  Delete,
  Retry,
  More,
}

export class ResponseCallbackData {
  callback: ResponseCallbackType;
  plugin?: string;
  resultNumber?: number;
  ownerId: number;
}

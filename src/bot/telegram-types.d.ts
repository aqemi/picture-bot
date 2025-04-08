import 'node-telegram-bot-api';

declare module 'node-telegram-bot-api' {
  interface Message {
    business_connection_id?: string;
    paid_media?: object;
    story?: object;
  }
  interface Audio {
    file_name?: string;
  }
  interface Video {
    file_name?: string;
  }

  interface Update {
    business_message?: Message;
    edited_business_message?: Message;
  }
}

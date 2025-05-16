import 'node-telegram-bot-api';

declare module 'node-telegram-bot-api' {
  interface Message {
    business_connection_id?: string;
    paid_media?: object;
    story?: object;
    gift?: GiftInfo;
    unique_gift?: UniqueGiftInfo;
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

  interface GiftInfo {
    gift: Gift;
    owned_gift_id?: string;
    convert_star_count?: number;
    prepaid_upgrade_star_count?: number;
    can_be_upgraded?: true;
    text?: string;
    entities?: MessageEntity[];
    is_private?: true;
  }

  interface Gift {
    id: string;
    sticker: Sticker;
    star_count: number;
    upgrade_star_count?: number;
    total_count?: number;
    remaining_count?: number;
  }

  interface UniqueGiftInfo {
    gift: UniqueGift;
    origin: 'upgrade' | 'transfer';
    owned_gift_id?: string;
    transfer_star_count?: number;
  }

  interface UniqueGift {
    base_name: string;
    name: string;
    number: number;
    model: UniqueGiftModel;
    symbol: UniqueGiftSymbol;
    backdrop: UniqueGiftBackdrop;
  }

  interface UniqueGiftModel {
    name: string;
    sticker: Sticker;
    rarity_per_mille: number;
  }

  interface UniqueGiftSymbol {
    name: string;
    sticker: Sticker;
    rarity_per_mille: number;
  }

  interface UniqueGiftBackdropColors {
    center_color: number;
    edge_color: number;
    symbol_color: number;
    text_color: number;
  }

  interface UniqueGiftBackdrop {
    name: string;
    colors: UniqueGiftBackdropColors;
    rarity_per_mille: number;
  }
}

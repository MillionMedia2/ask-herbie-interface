export interface Product {
  id: number;
  name: string;
  slug?: string;
  permalink: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number | null;
  stock_status?: "instock" | "outofstock" | string;
  on_sale?: boolean;
  category?: string;
  brand?: string;
  images?: Array<{ id?: number; src: string }>;
}

export interface IConversation {
  id: string;
  title: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

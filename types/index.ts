export interface Product {
  id?: number | string;
  name: string;
  /** Monograph / knowledge-base style payloads (same recommend-products API) */
  title?: string;
  docCanonicalId?: string;
  sectionHeading?: string;
  sectionKey?: string;
  taxonomy_path?: string;
  supplier?: string;
  sku?: string;
  /** Long markdown excerpt from retrieval; optional */
  text?: string;
  /** Human-readable multi-line summary from API */
  display?: string;
  slug?: string;
  permalink?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number | null;
  /** WooCommerce-style */
  stock_status?: "instock" | "outofstock" | string;
  /** recommend-products API */
  in_stock?: boolean;
  on_sale?: boolean;
  category?: string;
  brand?: string;
  /** WooCommerce objects or API string URLs */
  images?: Array<string | { id?: number; src: string }>;
  score?: number;
}

export interface RecommendedProductsPayload {
  count: number;
  /** Empty string when the API does not return a category */
  category: string;
  products: Product[];
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
  /** Present when user fetched recommendations (persisted for signed-in users) */
  recommendedProducts?: RecommendedProductsPayload;
}

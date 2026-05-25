import type { RecommendedProductsPayload } from "@/types";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  recommendedProducts?: RecommendedProductsPayload;
}

// Keep old interface for backward compatibility if needed
export interface LegacyMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

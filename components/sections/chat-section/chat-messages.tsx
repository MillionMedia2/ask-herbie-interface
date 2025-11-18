"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessageContent from "./chat-message-content";
import ProductsCarousel from "../products/products-carousel";
import { Sparkles } from "lucide-react";
import type { Message } from "./types";
import { fetchProducts } from "@/services/ai/fetchProducts";
import { isActionError } from "@/lib/error";
import { Product } from "@/types";
import { THINKING_TEXTS } from "@/constants/thinking-text";
interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  animatingMessageId: string | null;
  onProductsVisibilityChange?: (visible: boolean) => void;
}

export default function ChatMessages({
  messages,
  isLoading,
  animatingMessageId,
  onProductsVisibilityChange,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [thinkingText, setThinkingText] = useState(THINKING_TEXTS[0]);
  const [showProducts, setShowProducts] = useState(false);
  const [productsVisible, setProductsVisible] = useState(false);
  const [productsData, setProductsData] = useState<{
    category: string;
    count: number;
    products: Product[];
  } | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, productsVisible]);

  // Cycle loading phrases
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingText(
        THINKING_TEXTS[Math.floor(Math.random() * THINKING_TEXTS.length)]
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Hide products when messages length changes (new message sent)
  useEffect(() => {
    if (showProducts && messages.length > 0) {
      handleHideProducts();
    }
  }, [messages.length]);

  const handleTypewriterComplete = (messageId: string) => {
    console.log("Typewriter complete for message:", messageId);
  };

  const handleShowProducts = async (messageContent: string) => {
    setLoadingProducts(true);
    console.log("Fetching products for message:", messageContent);
    try {
      const response = await fetchProducts({ message: messageContent });
      if (isActionError(response)) {
        console.error("Error fetching products:", response);
        return;
      }
      if (response && response.products && response.products.length > 0) {
        setProductsData(response);
        setShowProducts(true);
        setTimeout(() => setProductsVisible(true), 100);
        onProductsVisibilityChange?.(true);
      } else {
        console.log("No products found");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleHideProducts = () => {
    setProductsVisible(false);
    onProductsVisibilityChange?.(false);
    setTimeout(() => {
      setShowProducts(false);
      setProductsData(null);
    }, 500);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      <div className="mx-auto space-y-4">
        {messages.map((message, index) => {
          const shouldAnimate = message.id === animatingMessageId;

          return (
            <div key={message.id}>
              <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-1 flex flex-col gap-2">
                  <ChatMessageContent
                    content={message.content}
                    senderId={message.senderId}
                    messageId={message.id}
                    shouldAnimate={shouldAnimate}
                    onTypewriterComplete={handleTypewriterComplete}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {messages.length > 0 &&
          !isLoading &&
          messages[messages.length - 1].senderId === "assistant" &&
          !showProducts && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                onClick={() => {
                  // Find the last user message
                  const lastUserMessage = [...messages]
                    .reverse()
                    .find((m) => m.senderId === "user");

                  if (lastUserMessage) {
                    handleShowProducts(lastUserMessage.content);
                  }
                }}
                disabled={loadingProducts}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all duration-200 hover:scale-105 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                {loadingProducts
                  ? "Loading Products..."
                  : "View Recommended Products"}
              </button>
            </div>
          )}

        {/* Products Carousel - appears after all messages */}
        {showProducts && productsData && (
          <div
            className={`transition-all duration-500 ease-in-out transform origin-top ${
              productsVisible
                ? "opacity-100 translate-y-0 scale-y-100"
                : "opacity-0 -translate-y-4 scale-y-95"
            }`}
            style={{
              maxHeight: productsVisible ? "1000px" : "0px",
              overflow: productsVisible ? "visible" : "hidden",
            }}
          >
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">
                    Herbie's Curated Products
                  </h3>
                </div>
                <button
                  onClick={handleHideProducts}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Hide
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {productsData.category} • {productsData.count} products found
              </p>
              <ProductsCarousel
                products={productsData.products}
                title=""
                subtitle=""
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-4 py-3 flex items-center space-x-3">
              {/* Animated dots */}
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-foreground"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-foreground"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>

              <p className="text-xs text-muted-foreground italic">
                {thinkingText}
              </p>
            </div>
          </div>
        )}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}

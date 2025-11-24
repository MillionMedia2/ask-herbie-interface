"use client";

import { useAppSelector } from "@/redux/store";
import ChatMessageContent from "./chat-message-content";
import ProductsCarousel from "../products/products-carousel";
import { Sparkles, AlertCircle } from "lucide-react";
import type { Message } from "./types";
import { useChatHook } from "@/hooks/use-chat-hook";

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
  const conversationId = messages[0]?.conversationId || null;
  const productsListRaw = useAppSelector((state) =>
    conversationId ? state.products.byConversation[conversationId] : undefined
  );

  const productsList = Array.isArray(productsListRaw) ? productsListRaw : [];

  // Use the unified chat hook
  const {
    scrollContainerRef,
    messagesEndRef,
    productsRefs,
    thinkingText,
    loadingProducts,
    noProductsFoundFor,
    getProductsForMessage,
    handleShowProducts,
    handleHideProducts,
    handleShowProductsFromRedux,
  } = useChatHook({
    messages,
    isLoading,
    animatingMessageId,
    productsList,
    conversationId,
    onProductsVisibilityChange,
  });

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="space-y-4 pb-4">
          {messages.map((message, index) => {
            const shouldAnimate = message.id === animatingMessageId;

            // Don't render empty assistant messages
            if (message.senderId === "assistant" && !message.content.trim()) {
              return null;
            }

            const productsForThisMessage = getProductsForMessage(message.id);
            const isLastMessage = index === messages.length - 1;
            const isAssistantMessage = message.senderId === "assistant";
            const isMessageComplete = message.content.trim().length > 0;
            const isNotStreamingThisMessage = animatingMessageId !== message.id;

            const canShowButton =
              isMessageComplete && (isNotStreamingThisMessage || !isLoading);
            const shouldShowButton =
              isLastMessage &&
              isAssistantMessage &&
              !productsForThisMessage &&
              canShowButton;

            return (
              <div key={message.id}>
                <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex-1 flex flex-col gap-2">
                    <ChatMessageContent
                      content={message.content}
                      senderId={message.senderId}
                      messageId={message.id}
                      shouldAnimate={shouldAnimate}
                      onTypewriterComplete={() => {}}
                    />
                  </div>
                </div>

                {/* View Recommended Products button */}
                {shouldShowButton && (
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button
                        onClick={() => {
                          const userMessage = messages
                            .slice(0, index)
                            .reverse()
                            .find((m) => m.senderId === "user");

                          if (userMessage) {
                            handleShowProducts(userMessage.content, message.id);
                          }
                        }}
                        disabled={loadingProducts === message.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all duration-200 hover:scale-105 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4" />
                        {loadingProducts === message.id
                          ? "Loading Products..."
                          : "View Recommended Products"}
                      </button>
                    </div>

                    {/* No Products Found Message */}
                    {noProductsFoundFor === message.id && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 w-fit">
                        <AlertCircle className="w-4 h-4" />
                        <span>No products found for this query</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Products display */}
                {productsForThisMessage && (
                  <div
                    ref={(el) => {
                      productsRefs.current[message.id] = el;
                    }}
                    className={`mt-4 transition-all duration-500 ease-in-out transform origin-top ${
                      productsForThisMessage.isVisible !== false
                        ? "opacity-100 translate-y-0 scale-y-100"
                        : "opacity-0 -translate-y-4 scale-y-95"
                    }`}
                    style={{
                      maxHeight:
                        productsForThisMessage.isVisible !== false
                          ? "1000px"
                          : "0px",
                      overflow:
                        productsForThisMessage.isVisible !== false
                          ? "visible"
                          : "hidden",
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
                          onClick={() => handleHideProducts(message.id)}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Hide
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {productsForThisMessage.category} •{" "}
                        {productsForThisMessage.count} products found
                      </p>
                      <ProductsCarousel
                        products={productsForThisMessage.products}
                        title=""
                        subtitle=""
                      />
                    </div>
                  </div>
                )}

                {/* Show Products button (for hidden products) */}
                {productsForThisMessage &&
                  productsForThisMessage.isVisible === false &&
                  !isLoading && (
                    <div className="flex justify-start mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button
                        onClick={() => handleShowProductsFromRedux(message.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all duration-200 hover:scale-105 w-fit"
                      >
                        <Sparkles className="w-4 h-4" />
                        Show Products
                      </button>
                    </div>
                  )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading &&
            (!animatingMessageId ||
              !messages
                .find((m) => m.id === animatingMessageId)
                ?.content.trim()) && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-4 py-3 flex items-center space-x-3">
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

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

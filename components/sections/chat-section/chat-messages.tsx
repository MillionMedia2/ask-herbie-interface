"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";
import ChatMessageContent from "./chat-message-content";
import ProductsCarousel from "../products/products-carousel";
import { Sparkles } from "lucide-react";
import type { Message } from "./types";
import { fetchProducts } from "@/services/ai/fetchProducts";
import { isActionError } from "@/lib/error";
import { THINKING_TEXTS } from "@/constants/thinking-text";
import {
  addProducts,
  setProductsVisibility,
} from "@/redux/features/products-slice";
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
  const dispatch = useDispatch<AppDispatch>();
  const conversationId = messages[0]?.conversationId || null;
  const productsListRaw = useAppSelector((state) =>
    conversationId ? state.products.byConversation[conversationId] : undefined
  );
  // Ensure productsList is always an array
  const productsList = Array.isArray(productsListRaw) ? productsListRaw : [];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const productsRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [thinkingText, setThinkingText] = useState(THINKING_TEXTS[0]);
  const [loadingProducts, setLoadingProducts] = useState<string | null>(null);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Smooth scroll to bottom using requestAnimationFrame
  const scrollToBottom = useCallback(
    (force = false) => {
      // Cancel any pending scroll
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Only auto-scroll if user is near bottom or forced
      if (!force && !isNearBottom()) {
        return;
      }

      rafRef.current = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        const target = messagesEndRef.current;

        if (container && target) {
          // Calculate target scroll position
          const targetScrollTop = target.offsetTop - container.offsetTop;
          const currentScrollTop = container.scrollTop;
          const distance = targetScrollTop - currentScrollTop;

          // Only scroll if there's a meaningful distance
          if (Math.abs(distance) > 1) {
            // For small incremental updates (during streaming), use instant scroll
            // For larger jumps, use smooth scroll
            if (Math.abs(distance) < 50) {
              // Small incremental update - use instant scroll for smoother streaming
              container.scrollTop = targetScrollTop;
            } else {
              // Larger jump - use smooth scroll
              container.scrollTo({
                top: targetScrollTop,
                behavior: "smooth",
              });
            }
          }
        }
      });
    },
    [isNearBottom]
  );

  // Handle user scroll - detect if user manually scrolled up
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isUserScrollingRef.current = true;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset flag after user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll when messages change (throttled for streaming)
  useEffect(() => {
    // Small delay to batch rapid updates during streaming
    const timeoutId = setTimeout(() => {
      // Only auto-scroll if user hasn't manually scrolled up
      if (!isUserScrollingRef.current || isNearBottom()) {
        scrollToBottom();
      }
    }, 50); // Small delay to batch rapid updates

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, productsList, scrollToBottom, isNearBottom]);

  // Force scroll on initial load or when loading starts
  useEffect(() => {
    if (isLoading || messages.length === 0) {
      scrollToBottom(true);
    }
  }, [isLoading, messages.length, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  // Helper function to get products for a specific message
  const getProductsForMessage = (messageId: string) => {
    return productsList.find((p) => p.messageId === messageId);
  };

  const handleTypewriterComplete = (messageId: string) => {
    console.log("Typewriter complete for message:", messageId);
  };

  const handleShowProducts = async (
    messageContent: string,
    assistantMessageId: string
  ) => {
    if (!conversationId) return;

    setLoadingProducts(assistantMessageId);

    try {
      const response = await fetchProducts({ message: messageContent });
      if (isActionError(response)) {
        console.error("Error fetching products:", response);
        setLoadingProducts(null);
        return;
      }
      if (response && response.products && response.products.length > 0) {
        // Save products to Redux with visible state
        dispatch(
          addProducts({
            conversationId,
            products: {
              category: response.category,
              count: response.count,
              products: response.products,
              messageId: assistantMessageId,
              isVisible: true,
            },
          })
        );
        onProductsVisibilityChange?.(true);

        // Wait for products to render, then scroll smoothly to them
        setTimeout(() => {
          const productsElement = productsRefs.current[assistantMessageId];
          if (productsElement && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const elementTop = productsElement.offsetTop - container.offsetTop;
            container.scrollTo({
              top: elementTop - 20, // 20px offset from top
              behavior: "smooth",
            });
          }
        }, 100); // Small delay to ensure DOM is updated
      } else {
        console.log("No products found");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(null);
    }
  };

  const handleHideProducts = (messageId: string) => {
    if (!conversationId) return;
    // Save visibility state to Redux
    dispatch(
      setProductsVisibility({
        conversationId,
        messageId,
        isVisible: false,
      })
    );
    onProductsVisibilityChange?.(false);
  };

  const handleShowProductsFromRedux = (messageId: string) => {
    if (!conversationId) return;
    // Save visibility state to Redux
    dispatch(
      setProductsVisibility({
        conversationId,
        messageId,
        isVisible: true,
      })
    );
    onProductsVisibilityChange?.(true);

    // Scroll smoothly to products after they're shown
    setTimeout(() => {
      const productsElement = productsRefs.current[messageId];
      if (productsElement && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const elementTop = productsElement.offsetTop - container.offsetTop;
        container.scrollTo({
          top: elementTop - 20, // 20px offset from top
          behavior: "smooth",
        });
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-4">
      <div className="mx-auto space-y-4">
        {messages.map((message, index) => {
          const shouldAnimate = message.id === animatingMessageId;

          // Don't render empty assistant messages (they'll show once content arrives)
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
                    onTypewriterComplete={handleTypewriterComplete}
                  />
                </div>
              </div>

              {/* Show "View Recommended Products" button after assistant messages if products haven't been fetched */}
              {shouldShowButton && (
                <div className="flex justify-start mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button
                    onClick={() => {
                      // Find the user message that corresponds to this assistant message
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
              )}

              {/* Render products right after the message that triggered them */}
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

              {/* Show "Show Products" button after the message that triggered products if hidden */}
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

        {/* Only show loader if there's no streaming message with content yet */}
        {isLoading &&
          (!animatingMessageId ||
            !messages
              .find((m) => m.id === animatingMessageId)
              ?.content.trim()) && (
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

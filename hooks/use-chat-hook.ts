import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { fetchProducts } from "@/services/ai/fetchProducts";
import { isActionError } from "@/lib/error";
import { THINKING_TEXTS } from "@/constants/thinking-text";
import {
  addProducts,
  setProductsVisibility,
} from "@/redux/features/products-slice";
import type { Message } from "@/components/sections/chat-section/types";

interface UseChatHookOptions {
  messages: Message[];
  isLoading: boolean;
  animatingMessageId: string | null;
  productsList: Array<{ messageId: string; isVisible?: boolean }>;
  conversationId: string | null;
  onProductsVisibilityChange?: (visible: boolean) => void;
}

interface UseChatHookReturn {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  productsRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  thinkingText: string;
  loadingProducts: string | null;
  noProductsFoundFor: string | null;
  scrollToBottom: (options?: { force?: boolean; smooth?: boolean }) => void;
  scrollToElement: (element: HTMLElement | null, offset?: number) => void;
  getProductsForMessage: (messageId: string) => any;
  handleShowProducts: (
    messageContent: string,
    assistantMessageId: string
  ) => Promise<void>;
  handleHideProducts: (messageId: string) => void;
  handleShowProductsFromRedux: (messageId: string) => void;
}

export function useChatHook({
  messages,
  isLoading,
  animatingMessageId,
  productsList,
  conversationId,
  onProductsVisibilityChange,
}: UseChatHookOptions): UseChatHookReturn {
  const dispatch = useDispatch<AppDispatch>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const productsRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef(0);
  const lastScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const hasScrolledInitiallyRef = useRef(false);

  const [thinkingText, setThinkingText] = useState(THINKING_TEXTS[0]);
  const [loadingProducts, setLoadingProducts] = useState<string | null>(null);
  const [noProductsFoundFor, setNoProductsFoundFor] = useState<string | null>(
    null
  );
  const [newProductsFetched, setNewProductsFetched] = useState(false);

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

  // Get products for a specific message
  const getProductsForMessage = useCallback(
    (messageId: string) => {
      return productsList.find((p) => p.messageId === messageId);
    },
    [productsList]
  );

  // Check if user is near the bottom
  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 100;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom < threshold;
  }, []);

  // Main scroll function with different behaviors
  const scrollToBottom = useCallback(
    (options: { force?: boolean; smooth?: boolean } = {}) => {
      const { force = false, smooth = true } = options;
      const container = scrollContainerRef.current;
      const target = messagesEndRef.current;

      if (!container || !target) return;

      // Don't auto-scroll if user has manually scrolled up (unless forced)
      if (!force && isUserScrollingRef.current && !isNearBottom()) {
        return;
      }

      const targetScrollTop = container.scrollHeight - container.clientHeight;
      const currentScrollTop = container.scrollTop;
      const distance = Math.abs(targetScrollTop - currentScrollTop);

      // Skip if already at bottom
      if (distance < 1) return;

      // During streaming with small changes, use instant scroll for smooth word-by-word following
      const isStreamingSmallUpdate =
        animatingMessageId && distance < 50 && !force;

      if (isStreamingSmallUpdate) {
        // Instant scroll during streaming - creates smooth following effect
        container.scrollTop = targetScrollTop;
      } else {
        // Smooth scroll for larger jumps (initial load, products, manual scroll)
        container.scrollTo({
          top: targetScrollTop,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    },
    [isNearBottom, animatingMessageId]
  );

  // Scroll to specific element (for showing hidden products)
  const scrollToElement = useCallback(
    (element: HTMLElement | null, offset = 20) => {
      if (!element || !scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const elementTop =
        elementRect.top - containerRect.top + container.scrollTop;

      container.scrollTo({
        top: elementTop - offset,
        behavior: "smooth",
      });
    },
    []
  );

  // Handle "View Recommended Products" button click
  const handleShowProducts = useCallback(
    async (messageContent: string, assistantMessageId: string) => {
      if (!conversationId) return;

      setLoadingProducts(assistantMessageId);
      setNoProductsFoundFor(null);

      try {
        const response = await fetchProducts({ message: messageContent });
        if (isActionError(response)) {
          console.error("Error fetching products:", response);
          setLoadingProducts(null);
          return;
        }

        if (response && response.products && response.products.length > 0) {
          // Save products to Redux
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

          // Trigger scroll to bottom for NEW recommended products
          setNewProductsFetched(true);
          setTimeout(() => setNewProductsFetched(false), 600);
        } else {
          console.log("No products found");
          setNoProductsFoundFor(assistantMessageId);
          // Auto-hide the "no products" message after 5 seconds
          setTimeout(() => {
            setNoProductsFoundFor(null);
          }, 5000);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(null);
      }
    },
    [conversationId, dispatch, onProductsVisibilityChange]
  );

  // Hide products (collapse)
  const handleHideProducts = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      dispatch(
        setProductsVisibility({
          conversationId,
          messageId,
          isVisible: false,
        })
      );
      onProductsVisibilityChange?.(false);
    },
    [conversationId, dispatch, onProductsVisibilityChange]
  );

  // Show products from Redux (already fetched, just hidden)
  const handleShowProductsFromRedux = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      dispatch(
        setProductsVisibility({
          conversationId,
          messageId,
          isVisible: true,
        })
      );
      onProductsVisibilityChange?.(true);

      // Scroll to products element (not to bottom, just show the products section)
      setTimeout(() => {
        const productsElement = productsRefs.current[messageId];
        if (productsElement) {
          scrollToElement(productsElement, 20);
        }
      }, 150);
    },
    [conversationId, dispatch, onProductsVisibilityChange, scrollToElement]
  );

  // Track user manual scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;

      // User scrolled up manually (not at bottom and scrolling up)
      if (currentScrollTop < lastScrollTopRef.current && !isNearBottom()) {
        isUserScrollingRef.current = true;
      }

      lastScrollTopRef.current = currentScrollTop;

      // Clear timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset user scrolling flag after they stop
      scrollTimeoutRef.current = setTimeout(() => {
        // If user scrolled back near bottom, re-enable auto-scroll
        if (isNearBottom()) {
          isUserScrollingRef.current = false;
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isNearBottom]);

  // Initial load - smooth scroll to bottom when opening conversation
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledInitiallyRef.current) {
      // Wait for DOM to render
      const timeoutId = setTimeout(() => {
        scrollToBottom({ force: true, smooth: true });
        hasScrolledInitiallyRef.current = true;
        isInitialLoadRef.current = false;
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  // Handle streaming - smooth word-by-word following
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !animatingMessageId) return;

    const currentScrollHeight = container.scrollHeight;
    const heightChanged = currentScrollHeight !== lastScrollHeightRef.current;
    lastScrollHeightRef.current = currentScrollHeight;

    // During streaming, continuously scroll to follow text
    if (heightChanged && !isInitialLoadRef.current) {
      // Use requestAnimationFrame for smoothest streaming scroll
      requestAnimationFrame(() => {
        if (!isUserScrollingRef.current || isNearBottom()) {
          scrollToBottom({ force: false, smooth: false });
        }
      });
    }
  }, [messages, animatingMessageId, scrollToBottom, isNearBottom]);

  // Handle loading state changes (when response starts)
  useEffect(() => {
    if (isLoading && !isInitialLoadRef.current) {
      // Scroll to bottom when new response starts loading
      const timeoutId = setTimeout(() => {
        scrollToBottom({ force: true, smooth: true });
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, scrollToBottom]);

  // Handle NEW products being fetched (recommended products)
  useEffect(() => {
    if (newProductsFetched && !isInitialLoadRef.current) {
      // Wait for products to render, then smooth scroll to bottom
      const timeoutId = setTimeout(() => {
        scrollToBottom({ force: true, smooth: true });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [newProductsFetched, scrollToBottom]);

  // Handle products visibility changes (showing hidden products)
  useEffect(() => {
    // Don't track on initial load
    if (isInitialLoadRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollHeight = container.scrollHeight;
    const heightChanged = currentScrollHeight !== lastScrollHeightRef.current;

    if (heightChanged && !animatingMessageId && !isLoading) {
      lastScrollHeightRef.current = currentScrollHeight;

      // Only auto-scroll if user is near bottom
      if (isNearBottom() && !isUserScrollingRef.current) {
        const timeoutId = setTimeout(() => {
          scrollToBottom({ force: false, smooth: true });
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [
    productsList,
    animatingMessageId,
    isLoading,
    scrollToBottom,
    isNearBottom,
  ]);

  return {
    scrollContainerRef,
    messagesEndRef,
    productsRefs,
    thinkingText,
    loadingProducts,
    noProductsFoundFor,
    scrollToBottom,
    scrollToElement,
    getProductsForMessage,
    handleShowProducts,
    handleHideProducts,
    handleShowProductsFromRedux,
  };
}

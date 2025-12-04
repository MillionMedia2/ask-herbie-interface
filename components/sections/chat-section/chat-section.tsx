"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";
import ChatSidebar from "./chat-sidebar";
import ChatMainCard from "./chat-main-card";
import ChatSuggestionsCard from "./chat-suggestion-card";
import { askAIStream } from "@/services/ai/askAIStream";
import {
  addConversation,
  setActiveConversation,
} from "@/redux/features/conversations-slice";
import { addMessage, updateMessage } from "@/redux/features/messages-slice";

export default function ChatSection() {
  const dispatch = useDispatch<AppDispatch>();
  const isProcessingRef = useRef(false);
  const lastUrlRef = useRef<string>("");

  const activeConversationId = useAppSelector(
    (state) => state.conversations.activeConversationId
  );
  const messages = useAppSelector((state) =>
    activeConversationId
      ? state.messages.byConversation[activeConversationId] || []
      : []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [activeConversationId, messages.length]);

  const getConversationTitle = (text: string): string => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  const handleQuestionClick = useCallback(
    async (question: string) => {
      setShowSuggestions(false);
      const conversationId = Date.now().toString();
      const conversationTitle = getConversationTitle(question);

      dispatch(
        addConversation({
          id: conversationId,
          title: conversationTitle,
          participants: ["user", "assistant"],
          updatedAt: new Date().toISOString(),
        })
      );
      dispatch(setActiveConversation(conversationId));
      setSidebarOpen(false);

      const userMessage = {
        id: Date.now().toString(),
        conversationId,
        senderId: "user",
        content: question,
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(userMessage));
      setIsLoading(true);

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMessageId,
        conversationId,
        senderId: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(aiMessage));
      setStreamingMessageId(aiMessageId);

      let accumulatedContent = "";
      let hasReceivedFirstChunk = false;
      await askAIStream({
        question,
        onChunk: (chunk: string) => {
          accumulatedContent += chunk;
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setIsLoading(false);
          }
          dispatch(
            updateMessage({
              id: aiMessageId,
              conversationId,
              updates: {
                content: accumulatedContent,
              },
            })
          );
        },
        onComplete: () => {
          setIsLoading(false);
          setStreamingMessageId(null);
        },
        onError: (error: Error) => {
          console.error("Streaming error:", error);
          dispatch(
            updateMessage({
              id: aiMessageId,
              conversationId,
              updates: {
                content:
                  "Something went wrong while fetching the response. Please try again.",
              },
            })
          );
          setIsLoading(false);
          setStreamingMessageId(null);
        },
      });
    },
    [dispatch]
  );

  // Function to check and process btn parameter from URL
  const checkAndProcessBtnParam = useCallback(() => {
    if (typeof window === "undefined") return;

    const currentUrl = window.location.href;

    console.log("[Herbie] Checking URL:", currentUrl);
    console.log("[Herbie] Last URL:", lastUrlRef.current);

    // Prevent concurrent processing
    if (isProcessingRef.current) {
      console.log("[Herbie] Already processing, skipping");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const btnText = urlParams.get("btn");

    console.log("[Herbie] btnText found:", btnText);

    // Only process if btn param exists
    if (!btnText) {
      console.log("[Herbie] No btn param, skipping");
      return;
    }

    // Check if this is a new URL (different from last processed)
    if (currentUrl === lastUrlRef.current) {
      console.log("[Herbie] Same URL as last processed, skipping");
      return;
    }

    console.log("[Herbie] Processing btn param:", btnText);

    // Mark as processing and store current URL
    isProcessingRef.current = true;
    lastUrlRef.current = currentUrl;

    // Clear any previously selected conversation to ensure fresh start
    dispatch(setActiveConversation(null));

    // Clean the URL after a short delay
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("btn");
      window.history.replaceState({}, "", url.pathname);
    }, 100);

    // Start a new conversation with the button text
    setTimeout(() => {
      console.log("[Herbie] Calling handleQuestionClick with:", btnText);
      handleQuestionClick(btnText).finally(() => {
        // Reset processing flag after completion
        isProcessingRef.current = false;
      });
    }, 150);
  }, [dispatch, handleQuestionClick]);

  // Handle btn parameter from URL - runs on mount and when dependencies change
  useEffect(() => {
    console.log("[Herbie] Main useEffect running");

    // Check on mount
    checkAndProcessBtnParam();

    // Listen for custom event from parent window (WordPress)
    const handleParentMessage = (event: MessageEvent) => {
      console.log("[Herbie] Received message from parent:", event.data);

      // Security: Only accept messages from your WordPress domain
      // Uncomment and update with your actual domain
      // if (event.origin !== "https://plantz.io") return;

      if (event.data?.type === "HERBIE_NEW_QUESTION") {
        console.log("[Herbie] New question from parent");
        isProcessingRef.current = false;
        lastUrlRef.current = "";

        // Small delay to ensure URL is updated
        setTimeout(() => {
          checkAndProcessBtnParam();
        }, 100);
      }
    };

    // Handle Navigation API (modern way, better than popstate)
    let navigationListener: (() => void) | null = null;

    if (typeof window !== "undefined" && "navigation" in window) {
      // @ts-ignore - Navigation API is new and may not be in types yet
      navigationListener = window.navigation.addEventListener(
        "navigate",
        (event: any) => {
          console.log("[Herbie] Navigation API - navigate event");
          const url = new URL(event.destination.url);
          if (url.searchParams.has("btn")) {
            isProcessingRef.current = false;
            setTimeout(() => checkAndProcessBtnParam(), 50);
          }
        }
      );
    }

    // Fallback: Monitor URL changes using MutationObserver on history
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const historyChangeHandler = () => {
      console.log("[Herbie] History changed");
      if (window.location.href.includes("btn=")) {
        isProcessingRef.current = false;
        setTimeout(() => checkAndProcessBtnParam(), 50);
      }
    };

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      historyChangeHandler();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      historyChangeHandler();
    };

    // Handle popstate (back/forward navigation)
    const handlePopState = () => {
      console.log("[Herbie] popstate event");
      isProcessingRef.current = false;
      setTimeout(() => checkAndProcessBtnParam(), 50);
    };

    // Handle bfcache restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("[Herbie] Page restored from bfcache");
        isProcessingRef.current = false;
        lastUrlRef.current = "";
        dispatch(setActiveConversation(null));
        checkAndProcessBtnParam();
      }
    };

    // Handle hash changes
    const handleHashChange = () => {
      console.log("[Herbie] hashchange event");
      if (window.location.href.includes("btn=")) {
        isProcessingRef.current = false;
        setTimeout(() => checkAndProcessBtnParam(), 50);
      }
    };

    window.addEventListener("message", handleParentMessage);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      // Restore original history methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;

      window.removeEventListener("message", handleParentMessage);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("hashchange", handleHashChange);

      if (navigationListener) {
        // @ts-ignore
        window.navigation.removeEventListener("navigate", navigationListener);
      }
    };
  }, [checkAndProcessBtnParam, dispatch]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    setShowSuggestions(false);

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = Date.now().toString();
      const conversationTitle = getConversationTitle(content);

      dispatch(
        addConversation({
          id: conversationId,
          title: conversationTitle,
          participants: ["user", "assistant"],
          updatedAt: new Date().toISOString(),
        })
      );
      dispatch(setActiveConversation(conversationId));
    }

    const userMessage = {
      id: Date.now().toString(),
      conversationId,
      senderId: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    dispatch(addMessage(userMessage));

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage = {
      id: aiMessageId,
      conversationId,
      senderId: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    dispatch(addMessage(aiMessage));
    setStreamingMessageId(aiMessageId);

    let accumulatedContent = "";
    let hasReceivedFirstChunk = false;
    await askAIStream({
      question: content,
      onChunk: (chunk: string) => {
        accumulatedContent += chunk;
        if (!hasReceivedFirstChunk) {
          hasReceivedFirstChunk = true;
          setIsLoading(false);
        }
        dispatch(
          updateMessage({
            id: aiMessageId,
            conversationId,
            updates: {
              content: accumulatedContent,
            },
          })
        );
      },
      onComplete: () => {
        setIsLoading(false);
        setStreamingMessageId(null);
      },
      onError: (error: Error) => {
        console.error("Streaming error:", error);
        dispatch(
          updateMessage({
            id: aiMessageId,
            conversationId,
            updates: {
              content:
                "Something went wrong while fetching the response. Please try again.",
            },
          })
        );
        setIsLoading(false);
        setStreamingMessageId(null);
      },
    });
  };

  const handleNewConversation = () => {
    dispatch(setActiveConversation(null));
    setShowSuggestions(true);
    setSidebarOpen(false);
    setStreamingMessageId(null);
  };

  const handleConversationClick = () => {
    setSidebarOpen(false);
    setStreamingMessageId(null);
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden p-[5px]">
      <div
        className={`fixed inset-y-0 left-0 bg-background md:bg-transparent z-40 w-[80%] md:relative md:z-auto md:w-[24%] xl:w-[20%] md:h-full transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <ChatSidebar
          onClose={() => setSidebarOpen(false)}
          onNewConversation={handleNewConversation}
          onConversationClick={handleConversationClick}
          onEmptyConversations={() => {
            setSidebarOpen(false);
            setShowSuggestions(true);
          }}
          isLoading={isLoading}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`flex-1 transition-all duration-300 ${
          showSuggestions
            ? "mx-[5px] md:w-[56%] xl:w-[60%]"
            : "md:w-[76%] xl:w-[80%]"
        }`}
      >
        <ChatMainCard
          messages={messages}
          isLoading={isLoading}
          showSuggestions={showSuggestions}
          onSendMessage={handleSendMessage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          streamingMessageId={streamingMessageId}
          onQuestionClick={handleQuestionClick}
        />
      </div>

      <div
        className={`hidden md:block transition-all duration-300 overflow-hidden ${
          showSuggestions
            ? "md:w-[28%] xl:w-[25%] opacity-100"
            : "md:w-0 opacity-0"
        }`}
      >
        {showSuggestions && (
          <ChatSuggestionsCard
            isLoading={isLoading}
            onQuestionClick={handleQuestionClick}
          />
        )}
      </div>
    </div>
  );
}

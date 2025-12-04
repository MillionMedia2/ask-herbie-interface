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
  const lastProcessedBtnRef = useRef<string | null>(null);

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

      // Create AI message placeholder
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

      // Stream the response - accumulate chunks since backend sends incremental chunks
      let accumulatedContent = "";
      let hasReceivedFirstChunk = false;
      await askAIStream({
        question,
        onChunk: (chunk: string) => {
          accumulatedContent += chunk;
          // Hide loader as soon as first chunk arrives
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

    const urlParams = new URLSearchParams(window.location.search);
    const btnText = urlParams.get("btn");

    // Only process if btn param exists in URL
    if (!btnText) return;

    // Skip if we already processed this exact btn value (prevents double-processing)
    if (btnText === lastProcessedBtnRef.current) return;

    console.log("[Herbie] Processing btn param:", btnText);

    // Mark as processed BEFORE any async operations
    lastProcessedBtnRef.current = btnText;

    // IMMEDIATELY clean the URL to prevent any re-processing
    const url = new URL(window.location.href);
    url.searchParams.delete("btn");
    window.history.replaceState({}, "", url.pathname);

    // Clear any previously selected conversation to ensure fresh start
    dispatch(setActiveConversation(null));

    // Start a new conversation with the button text
    setTimeout(() => {
      handleQuestionClick(btnText);
    }, 0);
  }, [dispatch, handleQuestionClick]);

  // Clear any selected conversation on mount - always start fresh
  useEffect(() => {
    dispatch(setActiveConversation(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Handle btn parameter from URL (WordPress iframe integration)
  useEffect(() => {
    // Check on initial mount
    checkAndProcessBtnParam();

    // Also handle bfcache restoration (when browser restores page from cache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache - reset and recheck
        console.log("[Herbie] Page restored from bfcache, rechecking URL");
        dispatch(setActiveConversation(null)); // Clear any selected chat
        lastProcessedBtnRef.current = null;
        checkAndProcessBtnParam();
      }
    };

    // Handle iframe focus (fallback for some edge cases)
    const handleFocus = () => {
      // Small delay to ensure URL is updated
      setTimeout(() => {
        // Reset ref to allow reprocessing even for same question
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("btn")) {
          dispatch(setActiveConversation(null)); // Clear any selected chat
          lastProcessedBtnRef.current = null;
        }
        checkAndProcessBtnParam();
      }, 50);
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
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

    // Create AI message placeholder
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

    // Stream the response - accumulate chunks since backend sends incremental chunks
    let accumulatedContent = "";
    let hasReceivedFirstChunk = false;
    await askAIStream({
      question: content,
      onChunk: (chunk: string) => {
        accumulatedContent += chunk;
        // Hide loader as soon as first chunk arrives
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

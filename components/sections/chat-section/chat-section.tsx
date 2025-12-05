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
  const hasCheckedInitialUrlRef = useRef(false);

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
      if (!question) return;

      // Prevent concurrent calls (but allow if called from processBtnParam which already set this)
      if (isProcessingRef.current) {
        console.log("[Herbie] Already processing, skipping duplicate call");
        return;
      }

      isProcessingRef.current = true;
      console.log("[Herbie] handleQuestionClick called with:", question);

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

      try {
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
            console.log("[Herbie] Stream complete");
            setIsLoading(false);
            setStreamingMessageId(null);
            isProcessingRef.current = false;
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
            isProcessingRef.current = false;
          },
        });
      } catch (error) {
        console.error("[Herbie] Error in handleQuestionClick:", error);
        setIsLoading(false);
        setStreamingMessageId(null);
        isProcessingRef.current = false;
      }
    },
    [dispatch]
  );

  // Function to process btn parameter from URL
  const processBtnParam = useCallback(
    (btnText: string) => {
      if (!btnText) {
        console.log("[Herbie] Skipping - no text");
        return;
      }

      console.log("[Herbie] Processing btn param:", btnText);

      // Clear any previously selected conversation
      dispatch(setActiveConversation(null));

      // Start the conversation (handleQuestionClick manages isProcessingRef)
      handleQuestionClick(btnText);
    },
    [dispatch, handleQuestionClick]
  );

  // Check URL on mount - this runs BEFORE any URL cleanup
  useEffect(() => {
    if (hasCheckedInitialUrlRef.current) return;

    console.log("[Herbie] Initial mount - checking URL");
    hasCheckedInitialUrlRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const btnText = urlParams.get("btn");

    console.log("[Herbie] Initial URL check - btnText:", btnText);

    if (btnText) {
      // Process the button text
      processBtnParam(btnText);

      // Clean URL after processing
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("btn");
        window.history.replaceState({}, "", url.pathname);
        console.log("[Herbie] URL cleaned");
      }, 500);
    }
  }, [processBtnParam]);

  // Listen for messages from parent WordPress page
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      console.log("[Herbie] Received message:", event.data);

      // Optional: Add origin check for security
      // if (event.origin !== "https://plantz.io") return;

      if (event.data?.type === "HERBIE_NEW_QUESTION" && event.data?.question) {
        console.log("[Herbie] New question from parent:", event.data.question);

        // Reset state for new question
        hasCheckedInitialUrlRef.current = false;
        isProcessingRef.current = false;
        dispatch(setActiveConversation(null));

        // Process the question
        setTimeout(() => {
          processBtnParam(event.data.question);
        }, 100);
      }
    };

    window.addEventListener("message", handleParentMessage);

    return () => {
      window.removeEventListener("message", handleParentMessage);
    };
  }, [processBtnParam, dispatch]);

  // Handle back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      console.log("[Herbie] popstate event");
      const urlParams = new URLSearchParams(window.location.search);
      const btnText = urlParams.get("btn");

      if (btnText) {
        hasCheckedInitialUrlRef.current = false;
        isProcessingRef.current = false;
        processBtnParam(btnText);
      }
    };

    // Handle bfcache restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("[Herbie] Page restored from bfcache");
        hasCheckedInitialUrlRef.current = false;
        isProcessingRef.current = false;
        dispatch(setActiveConversation(null));

        const urlParams = new URLSearchParams(window.location.search);
        const btnText = urlParams.get("btn");
        if (btnText) {
          processBtnParam(btnText);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [processBtnParam, dispatch]);

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
    isProcessingRef.current = false;
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

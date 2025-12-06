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

  const activeConversationId = useAppSelector(
    (state) => state.conversations.activeConversationId
  );
  const messages = useAppSelector((state) =>
    activeConversationId
      ? state.messages.byConversation[activeConversationId] || []
      : []
  );

  const [loadingConversationId, setLoadingConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);

  // Only show loading state if we're viewing the conversation that's loading
  const isLoading =
    loadingConversationId !== null &&
    loadingConversationId === activeConversationId;
  // Only show streaming for the active conversation
  const activeStreamingMessageId =
    streamingConversationId === activeConversationId
      ? streamingMessageId
      : null;
  // Track the initial btn param to process
  const [initialBtnParam, setInitialBtnParam] = useState<string | null>(null);
  // Ref to track if we've already processed the btn param in this render cycle
  const processingRef = useRef(false);

  // Read btn param from URL on mount - using ref to handle Strict Mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent double-processing in React Strict Mode
    if (processingRef.current) {
      console.log("[Herbie] Already processing, skipping...");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const btnText = urlParams.get("btn");
    const timestamp = urlParams.get("_t"); // Get the timestamp from WordPress

    console.log("[Herbie] Mount - URL:", window.location.href);
    console.log("[Herbie] Mount - btn param:", btnText);
    console.log("[Herbie] Mount - timestamp:", timestamp);

    // Skip if btn param is just the button label "Ask Herbie" (not an actual question)
    if (btnText && btnText.toLowerCase().trim() === "ask herbie") {
      console.log(
        "[Herbie] Skipping - btn is just button label, not a question"
      );
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("btn");
      url.searchParams.delete("_t");
      window.history.replaceState({}, "", url.pathname);
      return;
    }

    if (btnText) {
      // Create a unique key for this specific request
      const requestKey = `herbie_processed_${btnText}_${timestamp || "no-ts"}`;

      // Check if we've already processed this exact request
      const alreadyProcessed = sessionStorage.getItem(requestKey);

      if (!alreadyProcessed) {
        console.log("[Herbie] New request, processing...");
        processingRef.current = true;

        // Mark this request as processed
        sessionStorage.setItem(requestKey, "true");

        // Clear old processed keys (keep only last 10)
        const keys = Object.keys(sessionStorage).filter((k) =>
          k.startsWith("herbie_processed_")
        );
        if (keys.length > 10) {
          keys
            .slice(0, keys.length - 10)
            .forEach((k) => sessionStorage.removeItem(k));
        }

        // Store the btn param to process
        setInitialBtnParam(btnText);

        // Clean URL immediately
        const url = new URL(window.location.href);
        url.searchParams.delete("btn");
        url.searchParams.delete("_t");
        window.history.replaceState({}, "", url.pathname);

        // Clear any selected conversation immediately
        dispatch(setActiveConversation(null));
      } else {
        console.log(
          "[Herbie] Request already processed, skipping:",
          requestKey
        );
      }
    }

    return () => {
      processingRef.current = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [activeConversationId, messages.length]);

  const getConversationTitle = (text: string): string => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  const startNewConversation = useCallback(
    async (question: string) => {
      if (!question) return;

      console.log("[Herbie] Starting new conversation with:", question);

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
      setLoadingConversationId(conversationId);

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
      setStreamingConversationId(conversationId);

      let accumulatedContent = "";
      let hasReceivedFirstChunk = false;

      try {
        await askAIStream({
          question,
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setLoadingConversationId(null);
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
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
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
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
        });
      } catch (error) {
        console.error("[Herbie] Error:", error);
        setLoadingConversationId(null);
        setStreamingMessageId(null);
        setStreamingConversationId(null);
      }
    },
    [dispatch]
  );

  // Process the initial btn param after component is ready
  useEffect(() => {
    if (initialBtnParam) {
      console.log("[Herbie] Processing initial btn param:", initialBtnParam);
      startNewConversation(initialBtnParam);
      setInitialBtnParam(null);
    }
  }, [initialBtnParam, startNewConversation]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
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

    setLoadingConversationId(conversationId);

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
    setStreamingConversationId(conversationId);

    let accumulatedContent = "";
    let hasReceivedFirstChunk = false;
    await askAIStream({
      question: content,
      onChunk: (chunk: string) => {
        accumulatedContent += chunk;
        if (!hasReceivedFirstChunk) {
          hasReceivedFirstChunk = true;
          setLoadingConversationId(null);
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
        setLoadingConversationId(null);
        setStreamingMessageId(null);
        setStreamingConversationId(null);
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
        setLoadingConversationId(null);
        setStreamingMessageId(null);
        setStreamingConversationId(null);
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
          streamingMessageId={activeStreamingMessageId}
          onQuestionClick={startNewConversation}
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
            onQuestionClick={startNewConversation}
          />
        )}
      </div>
    </div>
  );
}

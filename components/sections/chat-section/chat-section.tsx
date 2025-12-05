"use client";

import { useState, useEffect, useCallback } from "react";
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

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  // Track the initial btn param to process
  const [initialBtnParam, setInitialBtnParam] = useState<string | null>(null);

  // Read btn param from URL on mount - BEFORE anything else
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const btnText = urlParams.get("btn");

    console.log("[Herbie] Mount - URL:", window.location.href);
    console.log("[Herbie] Mount - btn param:", btnText);

    if (btnText) {
      // Store the btn param to process
      setInitialBtnParam(btnText);

      // Clean URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete("btn");
      window.history.replaceState({}, "", url.pathname);
    }

    // Always clear any selected conversation on mount
    dispatch(setActiveConversation(null));
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
      } catch (error) {
        console.error("[Herbie] Error:", error);
        setIsLoading(false);
        setStreamingMessageId(null);
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

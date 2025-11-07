"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";
import ChatSidebar from "./chat-sidebar";
import ChatMainCard from "./chat-main-card";
import ChatSuggestionsCard from "./chat-suggestion-card";
import { askAI } from "@/services/ai/askAI";
import {
  addConversation,
  setActiveConversation,
} from "@/redux/features/conversations-slice";
import { addMessage } from "@/redux/features/messages-slice";

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

  // Hide suggestions when there's an active conversation with messages
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [activeConversationId, messages.length]);

  const getConversationTitle = (text: string): string => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  const handleQuestionClick = async (question: string) => {
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

    try {
      const response = await askAI({ question });
      console.log(response);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        conversationId,
        senderId: "assistant",
        content: response?.answer || "Sorry, I couldn't get a response.",
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(aiMessage));
    } catch (error) {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        conversationId,
        senderId: "assistant",
        content:
          "Something went wrong while fetching the response. Please try again.",
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(aiMessage));
    } finally {
      setIsLoading(false);
    }
  };

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

    try {
      const response = await askAI({ question: content });
      console.log(response);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        conversationId,
        senderId: "assistant",
        content: response?.answer || "Sorry, I couldn't get a response.",
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(aiMessage));
    } catch {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        conversationId,
        senderId: "assistant",
        content:
          "Something went wrong while fetching the response. Please try again.",
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(aiMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    dispatch(setActiveConversation(null));
    setShowSuggestions(true);
    setSidebarOpen(false);
  };

  const handleConversationClick = () => {
    // Suggestions will be hidden by useEffect when messages load
    setSidebarOpen(false);
  };

  const hasMessages = messages?.length > 0;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden p-[5px]">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-background md:bg-transparent z-40 w-[80%] md:relative md:z-auto md:w-[24%] xl:w-[20%] transition-transform duration-300 ${
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

      {/* Main Chat - Takes full width when suggestions are hidden */}
      <div
        className={`flex-1  transition-all duration-300 ${
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
        />
      </div>

      {/* Suggestions - With smooth animation */}
      <div
        className={`hidden md:block  transition-all duration-300 overflow-hidden ${
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

"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import ChatHeader from "./chat-header";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";
import ChatSidebar from "./chat-sidebar";
import { askAI } from "@/services/ai/askAI";
import {
  addConversation,
  setActiveConversation,
} from "@/redux/features/conversations-slice";
import { addMessage } from "@/redux/features/messages-slice";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";

const SUGGESTIONS = [
  "Am I eligible for medical cannabis?",
  "Recommend herbs for a headache",
  "What is Myrcene and what doies it do?",
  "What are the benefits of ginger?",
  "Natural ways to boost my immune system",
  "Remedies for an upset stomach",
];

export default function ChatSection() {
  const dispatch = useDispatch<AppDispatch>();
  const activeConversationId = useAppSelector(
    (state) => state.conversations.activeConversationId
  );
  const conversations = useAppSelector((state) => state.conversations.list);
  const messages = useAppSelector((state) =>
    activeConversationId
      ? state.messages.byConversation[activeConversationId] || []
      : []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true); // ✅ new state

  const getConversationTitle = (text: string): string => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  const handleQuestionClick = async (question: string) => {
    setShowSuggestions(false); // ✅ hide suggestions when sending
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
    setShowSuggestions(false); // ✅ hide suggestions when sending
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

  const hasMessages = messages?.length > 0;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[80%] md:relative md:z-auto md:w-[30%] xl:w-[20%] flex-col border-r border-border overflow-hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${hasMessages || showSuggestions ? "flex" : "md:hidden"}`}
      >
        <ChatSidebar
          onClose={() => setSidebarOpen(false)}
          onNewConversation={() => {
            setShowSuggestions(true);
            setSidebarOpen(true);
          }}
          onConversationClick={() => setShowSuggestions(false)}
          onEmptyConversations={() => {
            setSidebarOpen(false);
            setShowSuggestions(true);
          }}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div
        className={`flex flex-1 flex-col h-full w-full ${
          hasMessages ? "md:w-[70%] xl:w-[80%]" : "w-full"
        }`}
      >
        <ChatHeader onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div
          className="flex-1 overflow-y-auto"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {showSuggestions ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-y-auto">
              <div className="mb-8 text-center max-w-2xl">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <svg
                      className="h-8 w-8 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                </div>
                <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Hey there, I'm Herbie
                </h1>
                <p className="mx-auto max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
                  I'm your AI natural remedy companion, here to help you find
                  exactly what you need. Whether you're looking for product
                  information, personalized recommendations, or customer
                  support.
                </p>
                <p className="mt-6 text-sm sm:text-base text-muted-foreground">
                  Let's get started.
                </p>
              </div>

              {/* Suggestions (Mobile View) */}
              <div className="w-full max-w-2xl lg:hidden">
                <h2 className="mb-4 text-lg font-semibold text-foreground text-left">
                  Suggestions
                </h2>
                <div className="space-y-3">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleQuestionClick(suggestion)}
                      className="w-full rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/20 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} />
          )}
        </div>

        <ChatInput onSendMessage={handleSendMessage} isLoading={true} />
      </div>

      {showSuggestions && (
        <div className="hidden lg:flex lg:w-1/3 flex-col overflow-hidden bg-primary/20 border-l border-border">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              Suggestions
            </h2>
            <div className="space-y-3">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleQuestionClick(suggestion)}
                  className="w-full rounded-full border border-primary/30 bg-primary/10 px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/20 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

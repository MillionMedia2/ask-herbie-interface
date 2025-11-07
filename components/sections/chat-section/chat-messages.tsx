"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "./types";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

const THINKING_TEXTS = [
  "Thinking…",
  "Finding the best answer…",
  "Analyzing your question…",
  "Gathering insights…",
  "Almost there…",
];

export default function ChatMessages({
  messages,
  isLoading,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [thinkingText, setThinkingText] = useState(THINKING_TEXTS[0]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cycle through thinking texts every 2 seconds while loading
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setThinkingText(
        THINKING_TEXTS[Math.floor(Math.random() * THINKING_TEXTS.length)]
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-0 md:px-6 md:py-8">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2  ${
                message.senderId === "user"
                  ? "bg-primary text-primary-foreground max-w-xs lg:max-w-md"
                  : "bg-muted text-foreground max-w-xs lg:max-w-2xl"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
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

              {/* Dynamic thinking text */}
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

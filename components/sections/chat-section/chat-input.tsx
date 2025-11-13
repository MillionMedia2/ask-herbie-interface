"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({
  onSendMessage,
  isLoading,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-tborder-[#D0D0D0] bg-card px-4 sm:px-6 py-4 flex-shrink-0"
    >
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything (e.g. natural remedies for anxiety)"
          disabled={isLoading}
          className="flex-1 text-sm sm:text-base border border-[#D0D0D0] dark:border-border "
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 h-10 w-10 flex-shrink-0"
          size="icon"
        >
          <ArrowUp size={18} />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Herbie is AI-generated and may contain mistakes. This is not
        professional advice.
      </p>
    </form>
  );
}

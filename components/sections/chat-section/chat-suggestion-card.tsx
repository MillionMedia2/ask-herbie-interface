"use client";

import { SUGGESTIONS } from "@/constants/suggestions";

interface Props {
  isLoading: boolean;
  onQuestionClick: (question: string) => void;
}

export default function ChatSuggestionsCard({
  isLoading,
  onQuestionClick,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-card border border-[#D0D0D0] dark:border-border rounded-[14px] shadow-[0_4px_10px_rgba(0,0,0,0.05)] p-6 w-full">
      <h2 className="mb-6 text-xl font-semibold text-foreground">
        Suggestions
      </h2>

      <div className="space-y-3 overflow-y-auto">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onQuestionClick(suggestion)}
            disabled={isLoading}
            className="w-full rounded-full border border-primary/30 bg-primary/10 px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

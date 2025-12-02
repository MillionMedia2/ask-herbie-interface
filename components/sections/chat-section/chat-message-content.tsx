"use client";

import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageContentProps {
  content: string;
  senderId: string;
  messageId: string;
  shouldAnimate?: boolean;
  onTypewriterComplete?: (messageId: string) => void;
}

/**
 * Removes AI citation markers like 【4:12†source】 from text
 * This is a synchronous operation with no delay
 */
function stripCitations(text: string): string {
  return text.replace(/【[^】]*†[^】]*】/g, "");
}

function ChatMessageContent({
  content,
  senderId,
  messageId,
  shouldAnimate = false,
  onTypewriterComplete,
}: ChatMessageContentProps) {
  const isAssistant = senderId === "assistant";

  // Strip citation markers and memoize to avoid recalculating on every render
  const textToShow = useMemo(() => stripCitations(content), [content]);

  return (
    <div
      className={cn(
        "px-2 sm:px-4 py-3 rounded-2xl max-w-[93%] sm:max-w-[85%] wrap-break-word",
        isAssistant
          ? "bg-muted text-foreground"
          : "bg-primary text-primary-foreground ml-auto"
      )}
      style={{
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      {isAssistant ? (
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold mt-3 mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-3 mb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-2 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc space-y-1 my-2 ml-6">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal space-y-1 my-2 ml-6">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="pl-1 leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {textToShow}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="whitespace-pre-wrap">{textToShow}</div>
      )}
    </div>
  );
}

export default memo(ChatMessageContent);

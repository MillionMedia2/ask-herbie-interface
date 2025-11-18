"use client";

import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";
import { memo, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageContentProps {
  content: string;
  senderId: string;
  messageId: string;
  shouldAnimate?: boolean;
  onTypewriterComplete?: (messageId: string) => void;
}

function ChatMessageContent({
  content,
  senderId,
  messageId,
  shouldAnimate = false,
  onTypewriterComplete,
}: ChatMessageContentProps) {
  const isAssistant = senderId === "assistant";

  // Only use typewriter for assistant messages that should animate
  const { displayedText, isComplete } = useTypewriter({
    text: content,
    speed: 5,
    enabled: isAssistant && shouldAnimate,
  });

  // Notify parent when typewriter completes
  useEffect(() => {
    if (isComplete && onTypewriterComplete && isAssistant && shouldAnimate) {
      onTypewriterComplete(messageId);
    }
  }, [isComplete, onTypewriterComplete, messageId, isAssistant, shouldAnimate]);

  // Show full text for non-animated messages, typewriter text for animated ones
  const textToShow = isAssistant && shouldAnimate ? displayedText : content;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-2xl max-w-[85%] wrap-break-word",
        isAssistant
          ? "bg-muted text-foreground"
          : "bg-primary text-primary-foreground ml-auto"
      )}
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

"use client";

import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";
import { memo, useEffect } from "react";

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
        "px-4 py-3 rounded-2xl max-w-[85%] break-words whitespace-pre-wrap",
        isAssistant
          ? "bg-muted text-foreground"
          : "bg-primary text-primary-foreground ml-auto"
      )}
    >
      {textToShow}
    </div>
  );
}

export default memo(ChatMessageContent);

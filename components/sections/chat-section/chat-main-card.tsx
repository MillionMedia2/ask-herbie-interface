"use client";

import ChatHeader from "./chat-header";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";

interface Props {
  messages: any[];
  isLoading: boolean;
  showSuggestions: boolean;
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  streamingMessageId: string | null;
}

export default function ChatMainCard({
  messages,
  isLoading,
  showSuggestions,
  onSendMessage,
  onToggleSidebar,
  streamingMessageId,
}: Props) {
  const hasMessages = messages?.length > 0;

  return (
    <div className="flex flex-col h-full bg-card border border-[#D0D0D0] dark:border-border rounded-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.08)] overflow-hidden">
      <ChatHeader onSidebarToggle={onToggleSidebar} />

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {showSuggestions && !hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <h2 className="text-2xl font-semibold mb-2">
              Hey there, I'm <span className="text-primary">Herbie</span>
            </h2>
            <p className="max-w-md text-sm leading-relaxed mb-4">
              I'm your AI natural remedy companion. Ask me anything about
              remedies, recommendations, or support.
            </p>
            <div className="max-w-md mt-6 pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Disclaimer
              </p>
              <p className="text-xs text-muted-foreground">
                Herbie is AI-generated and may contain mistakes. This is not
                professional advice.
              </p>
            </div>
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            animatingMessageId={streamingMessageId}
          />
        )}
      </div>

      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}

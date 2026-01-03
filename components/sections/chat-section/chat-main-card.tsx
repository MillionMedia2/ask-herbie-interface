"use client";

import ChatHeader from "./chat-header";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";
import { SUGGESTIONS } from "@/constants/suggestions";

interface Props {
  messages: any[];
  isLoading: boolean;
  showSuggestions: boolean;
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  streamingMessageId: string | null;
  onQuestionClick: (question: string) => void;
  onRegenerateResponse?: (userMessage: string) => void;
  conversationTitle?: string;
  userInfo?: {
    id: number;
    name: string;
    email: string;
    username: string;
  } | null;
  loadingMessages?: boolean;
}

export default function ChatMainCard({
  messages,
  isLoading,
  showSuggestions,
  onSendMessage,
  onToggleSidebar,
  streamingMessageId,
  onQuestionClick,
  onRegenerateResponse,
  conversationTitle,
  userInfo,
  loadingMessages = false,
}: Props) {
  const hasMessages = messages?.length > 0;

  return (
    <div className="flex flex-col h-full bg-card border border-[#D0D0D0] dark:border-border rounded-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.08)] overflow-hidden">
      <ChatHeader
        onSidebarToggle={onToggleSidebar}
        messages={messages}
        conversationTitle={conversationTitle}
        userInfo={userInfo}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden sm:p-4 p-2 min-h-0">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Loading messages...
              </p>
            </div>
          </div>
        ) : showSuggestions && !hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <h2 className="text-2xl font-semibold mb-2">
              {userInfo?.name ? (
                <>
                  Hey there {userInfo.name.split(" ")[0]}, I'm{" "}
                  <span className="text-primary">Herbie</span>
                </>
              ) : (
                <>
                  Hey there, I'm <span className="text-primary">Herbie</span>
                </>
              )}
            </h2>
            <p className="max-w-md text-sm leading-relaxed mb-4">
              I'm your AI natural remedy companion. Ask me anything about
              remedies, recommendations, or support.
            </p>

            {/* Mobile suggestions - only shown on mobile */}
            <div className="w-full max-w-md mt-4 md:hidden">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Suggestions
              </h3>
              <div className="space-y-2">
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
            onRegenerateResponse={onRegenerateResponse}
          />
        )}
      </div>

      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}

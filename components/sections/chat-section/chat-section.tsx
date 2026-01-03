"use client";

import ChatSidebar from "./chat-sidebar";
import ChatMainCard from "./chat-main-card";
import ChatSuggestionsCard from "./chat-suggestion-card";
import { useChatSection } from "@/hooks/use-chat-section";

export default function ChatSection() {
  const {
    // State
    activeConversation,
    messages,
    sidebarOpen,
    showSuggestions,
    userInfo,
    loadingConversations,
    loadingMessages,
    // Computed
    isLoading,
    activeStreamingMessageId,
    // Actions
    setSidebarOpen,
    startNewConversation,
    handleSendMessage,
    handleNewConversation,
    handleConversationClick,
    handleRegenerateResponse,
    handleEmptyConversations,
  } = useChatSection();

  return (
    <div className="flex h-full w-full bg-background overflow-hidden p-[5px]">
      <div
        className={`fixed inset-y-0 left-0 bg-background md:bg-transparent z-40 w-[80%] md:relative md:z-auto md:w-[24%] xl:w-[20%] md:h-full transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <ChatSidebar
          onClose={() => setSidebarOpen(false)}
          onNewConversation={handleNewConversation}
          onConversationClick={handleConversationClick}
          onEmptyConversations={handleEmptyConversations}
          isLoading={isLoading}
          loadingConversations={loadingConversations}
          loadingMessages={loadingMessages}
          userInfo={userInfo}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`flex-1 transition-all duration-300 ${
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
          streamingMessageId={activeStreamingMessageId}
          onQuestionClick={startNewConversation}
          onRegenerateResponse={handleRegenerateResponse}
          conversationTitle={activeConversation?.title || "Chat"}
          userInfo={userInfo}
          loadingMessages={!!loadingMessages}
        />
      </div>

      <div
        className={`hidden md:block transition-all duration-300 overflow-hidden ${
          showSuggestions
            ? "md:w-[28%] xl:w-[25%] opacity-100"
            : "md:w-0 opacity-0"
        }`}
      >
        {showSuggestions && (
          <ChatSuggestionsCard
            isLoading={isLoading}
            onQuestionClick={startNewConversation}
          />
        )}
      </div>
    </div>
  );
}

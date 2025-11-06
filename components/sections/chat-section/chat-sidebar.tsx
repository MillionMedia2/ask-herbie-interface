"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { Search, Plus, MessageSquare, Trash2, X } from "lucide-react";
import {
  removeConversation,
  setActiveConversation,
} from "@/redux/features/conversations-slice";
import { clearMessages } from "@/redux/features/messages-slice";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";

interface ChatSidebarProps {
  onClose?: () => void;
  onNewConversation?: () => void;
  onConversationClick?: () => void;
  onEmptyConversations?: () => void;
  isLoading?: boolean;
}

export default function ChatSidebar({
  onClose,
  onNewConversation,
  onConversationClick,
  onEmptyConversations,
  isLoading,
}: ChatSidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const conversations = useAppSelector((state) => state.conversations.list);
  const activeConversationId = useAppSelector(
    (state) => state.conversations.activeConversationId
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConversation = (id: string) => {
    dispatch(removeConversation(id));
    dispatch(clearMessages(id));

    if (conversations.length === 1) {
      dispatch(setActiveConversation(null));
      onEmptyConversations?.();
    } else {
      if (activeConversationId === id) {
        dispatch(setActiveConversation(null));
      }
      onNewConversation?.();
    }

    onClose?.();
  };

  const handleConversationClick = (id: string) => {
    dispatch(setActiveConversation(id));
    onConversationClick?.();
  };

  const handleNewConversation = () => {
    dispatch(setActiveConversation(null));
    onNewConversation?.();
    onClose?.();
  };

  return (
    <div className="flex w-full flex-col text-sidebar-foreground h-full">
      <div className="flex items-center justify-between border-b border-sidebar-border p-4 md:hidden">
        <h3 className="font-semibold text-sidebar-foreground">Conversations</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-sidebar-accent/10 rounded-lg"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4">
        <button
          onClick={handleNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          disabled={isLoading}
        >
          <Plus size={18} />
          New conversation
        </button>
      </div>

      <div className="px-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-sidebar-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-sidebar-foreground">
            Saved Chats
          </h3>

          {filteredConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved conversations
            </p>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv.id)}
                  className={`group flex items-start justify-between rounded-lg p-3 cursor-pointer transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-sidebar-accent/10"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare
                        size={14}
                        className="flex-shrink-0 text-sidebar-accent"
                      />
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {conv.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="ml-2 flex-shrink-0 rounded p-1 opacity-0 transition-all hover:bg-destructive/10 group-hover:opacity-100"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

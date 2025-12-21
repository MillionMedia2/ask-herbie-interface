"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Search,
  Plus,
  MessageSquare,
  Trash2,
  X,
  Pin,
  Edit2,
  Check,
} from "lucide-react";
import {
  removeConversation,
  setActiveConversation,
  renameConversation,
  togglePinConversation,
  updateConversation,
  setConversations,
} from "@/redux/features/conversations-slice";
import { clearMessages } from "@/redux/features/messages-slice";
import { clearProducts } from "@/redux/features/products-slice";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";
import {
  deleteConversation,
  updateConversation as updateConversationAPI,
  pinConversation as pinConversationAPI,
  fetchConversations,
} from "@/services/api/conversations";
import { isActionError } from "@/lib/error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSidebarProps {
  onClose?: () => void;
  onNewConversation?: () => void;
  onConversationClick?: () => void;
  onEmptyConversations?: () => void;
  isLoading?: boolean;
  loadingConversations?: boolean;
  loadingMessages?: string | null;
}

export default function ChatSidebar({
  onClose,
  onNewConversation,
  onConversationClick,
  onEmptyConversations,
  isLoading,
  loadingConversations = false,
  loadingMessages = null,
}: ChatSidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const conversations = useAppSelector((state) => state.conversations.list);
  const activeConversationId = useAppSelector(
    (state) => state.conversations.activeConversationId
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Sort conversations: pinned first, then by date
  const sortedAndFilteredConversations = conversations
    .filter((conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Pinned conversations come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by date (newest first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    const id = conversationToDelete;

    try {
      const result = await deleteConversation(id);
      if (!isActionError(result)) {
        dispatch(removeConversation(id));
        dispatch(clearMessages(id));
        dispatch(clearProducts(id));

        // Refresh conversations list
        const conversationsResult = await fetchConversations();
        if (!isActionError(conversationsResult) && Array.isArray(conversationsResult)) {
          dispatch(setConversations(conversationsResult));
        }

        if (conversations.length === 1) {
          dispatch(setActiveConversation(null));
          onEmptyConversations?.();
        } else {
          if (activeConversationId === id) {
            dispatch(setActiveConversation(null));
          }
          onNewConversation?.();
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }

    setIsDeleteDialogOpen(false);
    setConversationToDelete(null);
    onClose?.();
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setConversationToDelete(null);
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

  const handlePinClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;

    try {
      const result = await pinConversationAPI(id, !conversation.isPinned);
      if (!isActionError(result)) {
        dispatch(updateConversation(result));
        dispatch(togglePinConversation(id));

        // Refresh conversations list to get updated order
        const conversationsResult = await fetchConversations();
        if (!isActionError(conversationsResult) && Array.isArray(conversationsResult)) {
          dispatch(setConversations(conversationsResult));
        }
      }
    } catch (error) {
      console.error("Failed to pin conversation:", error);
    }
  };

  const handleRenameClick = (
    conv: { id: string; title: string },
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleRenameSubmit = async (id: string) => {
    if (editingTitle.trim()) {
      try {
        const result = await updateConversationAPI(id, {
          title: editingTitle.trim(),
        });
        if (!isActionError(result)) {
          dispatch(updateConversation(result));
          dispatch(renameConversation({ id, title: editingTitle.trim() }));

          // Refresh conversations list
          const conversationsResult = await fetchConversations();
          if (!isActionError(conversationsResult) && Array.isArray(conversationsResult)) {
            dispatch(setConversations(conversationsResult));
          }
        }
      } catch (error) {
        console.error("Failed to rename conversation:", error);
      }
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleRenameCancelOrBlur = () => {
    setEditingId(null);
    setEditingTitle("");
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

          {loadingConversations ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent opacity-50"></div>
            </div>
          ) : sortedAndFilteredConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved conversations
            </p>
          ) : (
            <div className="space-y-2">
              {sortedAndFilteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() =>
                    editingId !== conv.id && handleConversationClick(conv.id)
                  }
                  className={`group flex flex-col rounded-lg p-3 relative ${
                    editingId !== conv.id ? "cursor-pointer" : ""
                  } transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-sidebar-accent/10"
                  }`}
                >
                  {loadingMessages === conv.id && (
                    <div className="absolute top-2 right-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent opacity-50"></div>
                    </div>
                  )}
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {editingId !== conv.id && (
                          <>
                            <MessageSquare
                              size={14}
                              className="shrink-0 text-sidebar-accent"
                            />
                            {conv.isPinned && (
                              <Pin
                                size={12}
                                className="shrink-0 text-primary fill-primary"
                              />
                            )}
                          </>
                        )}
                        {editingId === conv.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={handleRenameCancelOrBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameSubmit(conv.id);
                              } else if (e.key === "Escape") {
                                handleRenameCancelOrBlur();
                              }
                            }}
                            className="w-full bg-background border border-primary rounded px-2 py-1 text-sm font-medium text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="truncate text-sm font-medium text-sidebar-foreground">
                            {conv.title}
                          </p>
                        )}
                      </div>
                    </div>
                    {editingId === conv.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSubmit(conv.id);
                        }}
                        className="rounded p-1.5 hover:bg-primary/10 transition-all shrink-0 self-start"
                        aria-label="Save rename"
                      >
                        <Check size={16} className="text-primary" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1 w-full">
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                    {editingId !== conv.id && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => handlePinClick(conv.id, e)}
                          className={`rounded p-1.5 transition-all md:opacity-0 md:group-hover:opacity-100 hover:bg-primary/10 ${
                            conv.isPinned ? "md:opacity-100" : ""
                          }`}
                          aria-label={
                            conv.isPinned
                              ? "Unpin conversation"
                              : "Pin conversation"
                          }
                        >
                          <Pin
                            size={14}
                            className={
                              conv.isPinned
                                ? "text-primary fill-primary"
                                : "text-muted-foreground"
                            }
                          />
                        </button>
                        <button
                          onClick={(e) => handleRenameClick(conv, e)}
                          className="rounded p-1.5 transition-all md:opacity-0 md:group-hover:opacity-100 hover:bg-primary/10"
                          aria-label="Rename conversation"
                        >
                          <Edit2 size={14} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(conv.id, e)}
                          className="rounded p-1.5 transition-all md:opacity-0 md:group-hover:opacity-100 hover:bg-destructive/10"
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

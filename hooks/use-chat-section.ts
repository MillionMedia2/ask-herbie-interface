import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/store";
import type { AppDispatch } from "@/redux/store";
import { askAIStream } from "@/services/ai/askAIStream";
import {
  addConversation,
  setActiveConversation,
  setConversations,
} from "@/redux/features/conversations-slice";
import {
  addMessage,
  updateMessage,
  removeMessage,
  setMessages,
} from "@/redux/features/messages-slice";
import { logWordPressUserInfo } from "@/api/userInfo";
import {
  fetchConversations,
  createConversation,
} from "@/services/api/conversations";
import { fetchMessages, createMessage } from "@/services/api/messages";
import { isActionError } from "@/lib/error";

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  username: string;
}

export function useChatSection() {
  const dispatch = useDispatch<AppDispatch>();

  const activeConversationId = useAppSelector(
    (state) => state.conversations.activeConversationId
  );
  const activeConversation = useAppSelector((state) =>
    activeConversationId
      ? state.conversations.list.find((c) => c.id === activeConversationId)
      : null
  );
  const messages = useAppSelector((state) =>
    activeConversationId
      ? state.messages.byConversation[activeConversationId] || []
      : []
  );

  const [loadingConversationId, setLoadingConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const [initialBtnParam, setInitialBtnParam] = useState<string | null>(null);

  // Refs
  const processingRef = useRef(false);
  const backendConversationIds = useRef<Map<string, string>>(new Map());
  const fetchedConversations = useRef<Set<string>>(new Set()); // Track which conversations have been fetched

  // Computed values
  const isLoading =
    loadingConversationId !== null &&
    loadingConversationId === activeConversationId;
  const activeStreamingMessageId =
    streamingConversationId === activeConversationId
      ? streamingMessageId
      : null;

  // Helper function
  const getConversationTitle = (text: string): string => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  // Fetch conversations on mount (only if user is logged in with valid token)
  useEffect(() => {
    // Only proceed if both token and userInfo are valid
    if (!token || !userInfo) {
      // Clear conversations if user logs out or token is invalid
      dispatch(setConversations([]));
      return;
    }

    const loadConversations = async () => {
      setLoadingConversations(true);
      try {
        const result = await fetchConversations();
        if (!isActionError(result) && Array.isArray(result)) {
          dispatch(setConversations(result));
        }
      } catch (error) {
        // Silently fail - conversations will be empty
      } finally {
        setLoadingConversations(false);
      }
    };
    loadConversations();
  }, [dispatch, userInfo, token]);

  // Fetch messages when a conversation is selected (but not when streaming)
  useEffect(() => {
    if (!activeConversationId || streamingMessageId) {
      return;
    }

    // Check if we've already fetched messages for this conversation
    if (fetchedConversations.current.has(activeConversationId)) {
      return; // Already fetched, don't fetch again
    }

    // Check if messages already exist in Redux (from a previous session or creation)
    if (messages && messages.length > 0) {
      fetchedConversations.current.add(activeConversationId);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(activeConversationId);
      try {
        const result = await fetchMessages(activeConversationId);
        if (!isActionError(result) && Array.isArray(result)) {
          dispatch(
            setMessages({
              conversationId: activeConversationId,
              messages: result,
            })
          );
          // Mark as fetched after successful fetch
          fetchedConversations.current.add(activeConversationId);
        }
      } catch (error) {
        // Silently fail - messages will not be loaded
      } finally {
        setLoadingMessages(null);
      }
    };
    loadMessages();
  }, [activeConversationId, streamingMessageId, dispatch]);

  // Read btn param from URL on mount - using ref to handle Strict Mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent double-processing in React Strict Mode
    if (processingRef.current) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const btnText = urlParams.get("btn");
    const timestamp = urlParams.get("_t"); // Get the timestamp from WordPress
    const tokenParam = urlParams.get("token"); // Get the token from WordPress

    // Validate token: must be a non-empty string (not null, not empty string)
    // This prevents empty strings from being treated as valid tokens
    const isValidToken = tokenParam && tokenParam.trim().length > 0;

    // Store token as string if valid, otherwise null
    if (isValidToken && tokenParam) {
      const trimmedToken = tokenParam.trim();
      setToken(trimmedToken);

      // Fetch WordPress user info if token is valid
      const fetchUserInfo = async () => {
        try {
          const userInfo = await logWordPressUserInfo(trimmedToken);

          setUserInfo(userInfo);
        } catch (error) {
          // If auth fails, clear both token and userInfo
          setUserInfo(null);
          setToken(null);
        }
      };

      fetchUserInfo();
    } else {
      // No valid token - clear both token and userInfo
      setToken(null);
      setUserInfo(null);
    }

    // Skip if btn param is just a button label like "Ask Herbie", "Ask Herbi", etc. (not an actual question)
    const normalizedBtn = btnText?.toLowerCase().trim().replace(/\s+/g, " ");
    const isButtonLabel =
      normalizedBtn === "ask herbie" ||
      normalizedBtn === "ask herbi" ||
      normalizedBtn === "askherbie" ||
      normalizedBtn === "askherbi" ||
      normalizedBtn?.match(/^ask\s*herb(i|ie)?$/i);

    if (btnText && isButtonLabel) {
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("btn");
      url.searchParams.delete("_t");
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname);
      // Reset to default behavior - no chat selected, show suggestions
      dispatch(setActiveConversation(null));
      setShowSuggestions(true);
      return;
    }

    if (btnText) {
      // Create a unique key for this specific request
      const requestKey = `herbie_processed_${btnText}_${timestamp || "no-ts"}`;

      // Check if we've already processed this exact request
      const alreadyProcessed = sessionStorage.getItem(requestKey);

      if (!alreadyProcessed) {
        processingRef.current = true;

        // Mark this request as processed
        sessionStorage.setItem(requestKey, "true");

        // Clear old processed keys (keep only last 10)
        const keys = Object.keys(sessionStorage).filter((k) =>
          k.startsWith("herbie_processed_")
        );
        if (keys.length > 10) {
          keys
            .slice(0, keys.length - 10)
            .forEach((k) => sessionStorage.removeItem(k));
        }

        // Store the btn param to process
        setInitialBtnParam(btnText);

        // Clean URL immediately
        const url = new URL(window.location.href);
        url.searchParams.delete("btn");
        url.searchParams.delete("_t");
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.pathname);

        // Clear any selected conversation immediately
        dispatch(setActiveConversation(null));
      }
    }

    return () => {
      processingRef.current = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [activeConversationId, messages.length]);

  const startNewConversation = useCallback(
    async (question: string) => {
      if (!question) return;

      setShowSuggestions(false);

      // If user is not logged in or token is invalid, use temporary conversation (not saved to backend)
      // Check both token and userInfo to ensure we have valid authentication
      if (!token || !userInfo) {
        const tempConversationId = `temp-${Date.now()}`;

        // Create local user message for UI only (not saved to backend)
        const localUserMessage = {
          id: `local-user-${Date.now()}`,
          conversationId: tempConversationId,
          senderId: "user",
          content: question,
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(localUserMessage));

        const aiMessageId = `temp-ai-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          conversationId: tempConversationId,
          senderId: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(aiMessage));

        setStreamingMessageId(aiMessageId);
        setStreamingConversationId(tempConversationId);
        setLoadingConversationId(tempConversationId);
        dispatch(setActiveConversation(tempConversationId));
        setSidebarOpen(false);

        let accumulatedContent = "";
        let hasReceivedFirstChunk = false;

        // Send query to backend WITHOUT conversationId (no persistence)
        await askAIStream({
          question,
          conversationId: undefined, // No conversationId for non-logged-in users
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setLoadingConversationId(null);
            }
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: tempConversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );
          },
          onConversationId: () => {
            // Ignore conversationId for non-logged-in users
          },
          onComplete: async () => {
            // Just update the temp message (no backend save)
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: tempConversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );

            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
          onError: (error: Error) => {
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: tempConversationId,
                updates: {
                  content:
                    "Something went wrong while fetching the response. Please try again.",
                },
              })
            );
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
        });
        return;
      }

      // User is logged in - create conversation and save messages
      const conversationTitle = getConversationTitle(question);

      try {
        // create conversation via API
        const conversationResult = await createConversation({
          title: conversationTitle,
          participants: ["user", "assistant"],
          userId: userInfo.id,
        });

        if (isActionError(conversationResult)) {
          return;
        }

        const conversationId = (conversationResult as any).id;
        if (!conversationId) {
          return;
        }

        dispatch(addConversation(conversationResult as any));

        // Mark this conversation as fetched (we're creating it fresh)
        fetchedConversations.current.add(conversationId);

        // Create user message via API
        const userMessageResult = await createMessage({
          conversationId,
          senderId: "user",
          content: question,
          userId: userInfo.id,
        });

        if (isActionError(userMessageResult)) {
          return;
        }

        dispatch(addMessage(userMessageResult as any));

        const aiMessageId = `temp-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          conversationId,
          senderId: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(aiMessage));

        // Set streaming state BEFORE setting active conversation
        setStreamingMessageId(aiMessageId);
        setStreamingConversationId(conversationId);
        setLoadingConversationId(conversationId);

        // Now set active conversation and close sidebar
        dispatch(setActiveConversation(conversationId));
        setSidebarOpen(false);

        let accumulatedContent = "";
        let hasReceivedFirstChunk = false;

        await askAIStream({
          question,
          // New conversation, no backend conversationId yet
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setLoadingConversationId(null);
            }
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );
          },
          onConversationId: (backendId: string) => {
            backendConversationIds.current.set(conversationId, backendId);
          },
          onComplete: async () => {
            // Create assistant message via API
            const assistantMessageResult = await createMessage({
              conversationId,
              senderId: "assistant",
              content: accumulatedContent,
              userId: userInfo.id,
            });

            if (!isActionError(assistantMessageResult)) {
              // Remove temp message and add real one
              dispatch(removeMessage({ id: aiMessageId, conversationId }));
              dispatch(addMessage(assistantMessageResult as any));
            }

            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
          onError: (error: Error) => {
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId,
                updates: {
                  content:
                    "Something went wrong while fetching the response. Please try again.",
                },
              })
            );
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
        });
      } catch (error) {
        setLoadingConversationId(null);
        setStreamingMessageId(null);
        setStreamingConversationId(null);
      }
    },
    [dispatch, userInfo, token]
  );

  // Process the initial btn param after component is ready
  useEffect(() => {
    if (initialBtnParam) {
      startNewConversation(initialBtnParam);
      setInitialBtnParam(null);
    }
  }, [initialBtnParam, startNewConversation]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setShowSuggestions(false);

      // If user is not logged in or token is invalid, use temporary conversation (not saved to backend)
      // Check both token and userInfo to ensure we have valid authentication
      if (!token || !userInfo) {
        const tempConversationId = activeConversationId || `temp-${Date.now()}`;

        // Create local user message for UI only (not saved to backend)
        const localUserMessage = {
          id: `local-user-${Date.now()}`,
          conversationId: tempConversationId,
          senderId: "user",
          content,
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(localUserMessage));

        const aiMessageId = `temp-ai-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          conversationId: tempConversationId,
          senderId: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(aiMessage));

        setStreamingMessageId(aiMessageId);
        setStreamingConversationId(tempConversationId);
        setLoadingConversationId(tempConversationId);

        if (!activeConversationId) {
          dispatch(setActiveConversation(tempConversationId));
        }

        let accumulatedContent = "";
        let hasReceivedFirstChunk = false;

        // Send query to backend WITHOUT conversationId (no persistence)
        await askAIStream({
          question: content,
          conversationId: undefined, // No conversationId for non-logged-in users
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setLoadingConversationId(null);
            }
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: tempConversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );
          },
          onConversationId: () => {
            // Ignore conversationId for non-logged-in users
          },
          onComplete: async () => {
            // User not logged in - just update the temp message with final content (no backend save)
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: tempConversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );

            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
          onError: (error: Error) => {
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: tempConversationId,
                updates: {
                  content:
                    "Something went wrong while fetching the response. Please try again.",
                },
              })
            );
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
        });
        return;
      }

      // User is logged in - create conversation and save messages
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversationTitle = getConversationTitle(content);

        try {
          // Create conversation via API
          const conversationResult = await createConversation({
            title: conversationTitle,
            participants: ["user", "assistant"],
            userId: userInfo.id,
          });

          if (isActionError(conversationResult)) {
            return;
          }

          conversationId = (conversationResult as any).id;
          if (!conversationId) {
            return;
          }
          dispatch(addConversation(conversationResult as any));

          // Mark this new conversation as fetched (we're creating it fresh)
          fetchedConversations.current.add(conversationId);
        } catch (error) {
          return;
        }
      }

      if (!conversationId) {
        return;
      }

      try {
        // Create user message via API
        const userMessageResult = await createMessage({
          conversationId,
          senderId: "user",
          content,
          userId: userInfo.id,
        });

        if (isActionError(userMessageResult)) {
          return;
        }

        dispatch(addMessage(userMessageResult as any));

        const aiMessageId = `temp-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          conversationId,
          senderId: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(aiMessage));

        // Set streaming state BEFORE setting active conversation (for new conversations)
        setStreamingMessageId(aiMessageId);
        setStreamingConversationId(conversationId);
        setLoadingConversationId(conversationId);

        // Set active conversation if this was a new conversation
        if (!activeConversationId) {
          dispatch(setActiveConversation(conversationId));
        }

        let accumulatedContent = "";
        let hasReceivedFirstChunk = false;

        // Get the backend conversationId for this conversation (if any)
        const backendConversationId =
          backendConversationIds.current.get(conversationId) || undefined;

        await askAIStream({
          question: content,
          conversationId: backendConversationId, // Pass backend's conversationId for conversation context
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setLoadingConversationId(null);
            }
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );
          },
          onConversationId: (backendId: string) => {
            backendConversationIds.current.set(conversationId, backendId);
          },
          onComplete: async () => {
            // Create assistant message via API
            if (conversationId) {
              const assistantMessageResult = await createMessage({
                conversationId,
                senderId: "assistant",
                content: accumulatedContent,
                userId: userInfo.id,
              });

              if (!isActionError(assistantMessageResult)) {
                // Remove temp message and add real one
                dispatch(removeMessage({ id: aiMessageId, conversationId }));
                dispatch(addMessage(assistantMessageResult as any));
              }
            }

            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
          onError: (error: Error) => {
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId,
                updates: {
                  content:
                    "Something went wrong while fetching the response. Please try again.",
                },
              })
            );
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
        });
      } catch (error) {
        setLoadingConversationId(null);
      }
    },
    [activeConversationId, dispatch, userInfo, token]
  );

  const handleNewConversation = useCallback(() => {
    dispatch(setActiveConversation(null));
    setShowSuggestions(true);
    setSidebarOpen(false);
    setStreamingMessageId(null);
  }, [dispatch]);

  const handleConversationClick = useCallback(() => {
    setSidebarOpen(false);
    setStreamingMessageId(null);
  }, []);

  const handleRegenerateResponse = useCallback(
    async (userMessage: string) => {
      if (!activeConversationId) return;

      // Don't remove the last message - keep it visible
      // Just send a new query to get a new response
      setLoadingConversationId(activeConversationId);

      // If user is not logged in or token is invalid, use temporary conversation
      // Check both token and userInfo to ensure we have valid authentication
      if (!token || !userInfo) {
        // Create local user message for UI only (not saved to backend)
        const localUserMessage = {
          id: `local-user-${Date.now()}`,
          conversationId: activeConversationId,
          senderId: "user",
          content: userMessage,
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(localUserMessage));

        const aiMessageId = `temp-ai-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          conversationId: activeConversationId,
          senderId: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(aiMessage));
        setStreamingMessageId(aiMessageId);
        setStreamingConversationId(activeConversationId);

        let accumulatedContent = "";
        let hasReceivedFirstChunk = false;

        // Send query to backend WITHOUT conversationId (no persistence for non-logged-in users)
        await askAIStream({
          question: userMessage,
          conversationId: undefined, // No conversationId for non-logged-in users
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setLoadingConversationId(null);
            }
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: activeConversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );
          },
          onConversationId: () => {
            // Ignore conversationId for non-logged-in users
          },
          onComplete: async () => {
            // User not logged in - just update the temp message with final content (no backend save)
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: activeConversationId,
                updates: {
                  content: accumulatedContent,
                },
              })
            );

            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
          onError: (error: Error) => {
            dispatch(
              updateMessage({
                id: aiMessageId,
                conversationId: activeConversationId,
                updates: {
                  content:
                    "Something went wrong while fetching the response. Please try again.",
                },
              })
            );
            setLoadingConversationId(null);
            setStreamingMessageId(null);
            setStreamingConversationId(null);
          },
        });
        return;
      }

      // User is logged in - create and save messages
      try {
        // Create a new user message to send to backend
        const userMessageResult = await createMessage({
          conversationId: activeConversationId,
          senderId: "user",
          content: userMessage,
          userId: userInfo.id,
        });

        if (isActionError(userMessageResult)) {
          return;
        }

        dispatch(addMessage(userMessageResult as any));
      } catch (error) {
        return;
      }

      const aiMessageId = `temp-${Date.now()}`;
      const aiMessage = {
        id: aiMessageId,
        conversationId: activeConversationId,
        senderId: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      dispatch(addMessage(aiMessage));
      setStreamingMessageId(aiMessageId);
      setStreamingConversationId(activeConversationId);

      let accumulatedContent = "";
      let hasReceivedFirstChunk = false;

      // Get the backend conversationId for this conversation (if any)
      const backendConversationId =
        backendConversationIds.current.get(activeConversationId);

      await askAIStream({
        question: userMessage,
        conversationId: backendConversationId || undefined,
        onChunk: (chunk: string) => {
          accumulatedContent += chunk;
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setLoadingConversationId(null);
          }
          dispatch(
            updateMessage({
              id: aiMessageId,
              conversationId: activeConversationId,
              updates: {
                content: accumulatedContent,
              },
            })
          );
        },
        onConversationId: (backendId: string) => {
          if (activeConversationId) {
            backendConversationIds.current.set(activeConversationId, backendId);
          }
        },
        onComplete: async () => {
          // Create assistant message via API
          if (activeConversationId) {
            const assistantMessageResult = await createMessage({
              conversationId: activeConversationId,
              senderId: "assistant",
              content: accumulatedContent,
              userId: userInfo.id,
            });

            if (!isActionError(assistantMessageResult)) {
              // Remove temp message and add real one
              dispatch(
                removeMessage({
                  id: aiMessageId,
                  conversationId: activeConversationId,
                })
              );
              dispatch(addMessage(assistantMessageResult as any));
            }
          }

          setLoadingConversationId(null);
          setStreamingMessageId(null);
          setStreamingConversationId(null);
        },
        onError: (error: Error) => {
          dispatch(
            updateMessage({
              id: aiMessageId,
              conversationId: activeConversationId,
              updates: {
                content:
                  "Something went wrong while fetching the response. Please try again.",
              },
            })
          );
          setLoadingConversationId(null);
          setStreamingMessageId(null);
          setStreamingConversationId(null);
        },
      });
    },
    [activeConversationId, messages, dispatch, userInfo, token]
  );

  const handleEmptyConversations = useCallback(() => {
    setSidebarOpen(false);
    setShowSuggestions(true);
  }, []);

  return {
    // State
    activeConversationId,
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
  };
}

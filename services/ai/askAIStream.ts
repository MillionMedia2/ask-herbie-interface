import { API_URL } from "@/constants/constants";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";

/**
 * Stream AI response using Server-Sent Events
 * @param question - The user's question
 * @param conversationId - Optional conversation ID for maintaining context (backend's previous_response_id)
 * @param onChunk - Callback fired for each chunk of text received
 * @param onConversationId - Callback fired when backend returns the conversation ID
 * @param onComplete - Callback fired when streaming completes
 * @param onError - Callback fired if an error occurs
 */
export const askAIStream = async ({
  question,
  conversationId,
  onChunk,
  onConversationId,
  onComplete,
  onError,
}: {
  question: string;
  conversationId?: string;
  onChunk: (chunk: string) => void;
  onConversationId?: (conversationId: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}): Promise<void> => {
  try {
    if (!API_URL) {
      onError(new Error("API URL is not configured"));
      return;
    }

    const response = await fetch(`${API_URL}ask/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, conversationId }),
    });

    if (!response.ok) {
      const error: any = new Error(`HTTP error! status: ${response.status}`);
      error.response = {
        status: response.status,
        data: { message: `HTTP error! status: ${response.status}` },
      };
      const handledError = handleApiErrorWithoutException(error);
      onError(new Error(handledError.message || "Failed to fetch AI response"));
      return;
    }

    if (!response.body) {
      const error: any = new Error("No response body available");
      const handledError = handleApiErrorWithoutException(error);
      onError(new Error(handledError.message || "No response body available"));
      return;
    }

    const reader = response.body.getReader();

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;

        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim(); // Remove "data: " prefix and trim whitespace

          if (data === "[DONE]") {
            onComplete();
            return;
          }

          // Skip empty data
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              const error: any = new Error(parsed.error);
              const handledError = handleApiErrorWithoutException(error);
              onError(new Error(handledError.message || parsed.error));
              return;
            }
            // Handle conversationId from backend (for maintaining conversation context)
            if (parsed.type === "conversationId" && parsed.conversationId) {
              onConversationId?.(parsed.conversationId);
            }
            // Handle content - backend sends incremental chunks (one word at a time)
            if (
              parsed.type === "content" &&
              parsed.content !== undefined &&
              parsed.content !== null
            ) {
              onChunk(parsed.content);
            }
            // Handle done event
            if (parsed.type === "done") {
              onComplete();
              return;
            }
          } catch (e) {
            // If parsing fails, it might be plain text content
            // Try to handle it as plain text
            if (data && !data.startsWith("{") && !data.startsWith("[")) {
              onChunk(data);
            } else {
              console.error("Failed to parse SSE data:", e, "Data:", data);
              const error: any =
                e instanceof Error ? e : new Error("Failed to parse SSE data");
              const handledError = handleApiErrorWithoutException(error);
              onError(
                new Error(handledError.message || "Failed to parse SSE data")
              );
            }
          }
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const handledError = handleApiErrorWithoutException(error);
    onError(new Error(handledError.message || "Unknown error occurred"));
  }
};

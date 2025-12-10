import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { IMessage } from "@/types";

interface MessagesState {
  byConversation: Record<string, IMessage[]>;
}

const initialState: MessagesState = {
  byConversation: {},
};

export const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: IMessage[] }>
    ) => {
      const { conversationId, messages } = action.payload;
      state.byConversation[conversationId] = messages;
    },
    addMessage: (state, action: PayloadAction<IMessage>) => {
      const msg = action.payload;
      if (!state.byConversation[msg.conversationId]) {
        state.byConversation[msg.conversationId] = [];
      }
      state.byConversation[msg.conversationId].push(msg);
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.byConversation[action.payload];
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        id: string;
        conversationId: string;
        updates: Partial<IMessage>;
      }>
    ) => {
      const { id, conversationId, updates } = action.payload;
      const message = state.byConversation[conversationId].find(
        (m) => m.id === id
      );
      if (message) {
        Object.assign(message, updates);
      }
    },
    removeMessage: (
      state,
      action: PayloadAction<{ id: string; conversationId: string }>
    ) => {
      const { id, conversationId } = action.payload;
      if (state.byConversation[conversationId]) {
        state.byConversation[conversationId] = state.byConversation[
          conversationId
        ].filter((m) => m.id !== id);
      }
    },
  },
});

export const {
  setMessages,
  addMessage,
  clearMessages,
  updateMessage,
  removeMessage,
} = messagesSlice.actions;
export default messagesSlice.reducer;

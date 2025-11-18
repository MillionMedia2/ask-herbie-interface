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
  },
});

export const { setMessages, addMessage, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;

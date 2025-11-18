import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { IConversation } from "@/types";

interface ConversationsState {
  list: IConversation[];
  activeConversationId: string | null;
}

const initialState: ConversationsState = {
  list: [],
  activeConversationId: null,
};

export const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<IConversation[]>) => {
      state.list = action.payload;
    },
    addConversation: (state, action: PayloadAction<IConversation>) => {
      state.list.unshift(action.payload);
    },
    updateConversation: (state, action: PayloadAction<IConversation>) => {
      const index = state.list.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) state.list[index] = action.payload;
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((c) => c.id !== action.payload);
    },
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
  },
});

export const {
  setConversations,
  addConversation,
  updateConversation,
  removeConversation,
  setActiveConversation,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;

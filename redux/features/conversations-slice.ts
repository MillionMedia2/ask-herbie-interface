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
    renameConversation: (
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) => {
      const index = state.list.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.list[index].title = action.payload.title;
      }
    },
    togglePinConversation: (state, action: PayloadAction<string>) => {
      const index = state.list.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.list[index].isPinned = !state.list[index].isPinned;
      }
    },
  },
});

export const {
  setConversations,
  addConversation,
  updateConversation,
  removeConversation,
  setActiveConversation,
  renameConversation,
  togglePinConversation,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types";

interface ProductsData {
  category: string;
  count: number;
  products: Product[];
  messageId: string; // Track which message triggered these products
  isVisible?: boolean; // Track visibility state
}

interface ProductsState {
  byConversation: Record<string, ProductsData[]>; // Array of products per conversation
}

const initialState: ProductsState = {
  byConversation: {},
};

export const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    addProducts: (
      state,
      action: PayloadAction<{
        conversationId: string;
        products: ProductsData;
      }>
    ) => {
      const { conversationId, products } = action.payload;
      if (!state.byConversation[conversationId]) {
        state.byConversation[conversationId] = [];
      }
      // Check if products already exist for this messageId, if so replace it
      const existingIndex = state.byConversation[conversationId].findIndex(
        (p) => p.messageId === products.messageId
      );
      if (existingIndex !== -1) {
        state.byConversation[conversationId][existingIndex] = products;
      } else {
        state.byConversation[conversationId].push(products);
      }
    },
    setProductsVisibility: (
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: string;
        isVisible: boolean;
      }>
    ) => {
      const { conversationId, messageId, isVisible } = action.payload;
      const productsList = state.byConversation[conversationId];
      if (productsList) {
        const productData = productsList.find((p) => p.messageId === messageId);
        if (productData) {
          productData.isVisible = isVisible;
        }
      }
    },
    clearProducts: (state, action: PayloadAction<string>) => {
      delete state.byConversation[action.payload];
    },
  },
});

export const { addProducts, setProductsVisibility, clearProducts } =
  productsSlice.actions;
export default productsSlice.reducer;


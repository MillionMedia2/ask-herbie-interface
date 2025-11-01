import localStorage from "redux-persist/es/storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { useSelector, type TypedUseSelectorHook } from "react-redux";
import conversationsSlice from "./features/conversations-slice";
import messagesSlice from "./features/messages-slice";

const rootReducer = combineReducers({
  conversations: conversationsSlice,
  messages: messagesSlice,
});

const persistConfig = {
  key: "root",
  storage: localStorage,
  whitelist: ["conversations", "messages"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

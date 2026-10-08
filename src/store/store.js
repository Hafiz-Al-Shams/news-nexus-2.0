import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import newsReducer from "./slices/newsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    news: newsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['news/setArticles', 'news/setGuardianArticles'],
        // Ignore these paths in the state
        ignoredPaths: ['news.articles', 'news.guardianArticles', 'news.combinedArticles'],
      },
      immutableCheck: {
        // Ignore these paths in the state
        ignoredPaths: ['news.articles', 'news.guardianArticles', 'news.combinedArticles'],
      },
    }),
});
// src>hooks>useGuardianNews.js  (NEW)
"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchGuardianArticles, setActiveSource } from "@/store/slices/newsSlice";

// Shared "load the news for the selected filters" action.
// It is used by the right sidebar ("Get The News" button) AND by the retry buttons in the news section,
// so the logic (and the toast messages) live in ONE place instead of being copied twice.
export default function useGuardianNews() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.news.filters); // the filters the visitor has currently selected

  const fetchGuardianNews = useCallback(async () => {
    try {
      const result = await dispatch(fetchGuardianArticles(filters)).unwrap();
      dispatch(setActiveSource("guardian"));

      if (result.articles && result.articles.length > 0) {
        if (result.stale) {
          toast("Guardian is unavailable right now, showing saved news"); // expired cache used as a fallback
        } else {
          toast.success(`Loaded ${result.articles.length} articles from Guardian`);
        }
      } else {
        toast.error("No articles found from Guardian");
      }
    } catch (error) {
      if (error?.name === "ConditionError") return; // a load was already running, ignore the extra click
      console.error("Guardian fetch error:", error);

      if (error.message?.includes("Unauthorized")) {
        toast.error("Please login to view news");
      } else if (error.code === "RATE_LIMIT_EXCEEDED") {
        toast.error("Guardian API rate limit exceeded. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to load Guardian articles");
      }
    }
  }, [dispatch, filters]);

  return { fetchGuardianNews };
}
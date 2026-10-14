// src>components>SearchBox.jsx  (NEW)
// The search input. It only saves the typed text in Redux.
// The debounce + the real search live in NewsSection (ONE place), so the sidebar box and the
// mobile box never start two searches for the same typing.
"use client";

import { useDispatch, useSelector } from "react-redux";
import { setSearchInput } from "@/store/slices/newsSlice";
import { MAX_SEARCH_LENGTH, MIN_SEARCH_LENGTH, normalizeKeyword } from "@/utils/search";

export default function SearchBox() {
  const dispatch = useDispatch();
  const searchInput = useSelector((state) => state.news.searchInput); // what is typed right now
  const searchLoading = useSelector((state) => state.news.searchLoading);

  const keywordLength = normalizeKeyword(searchInput).length;
  const tooShort = searchInput.trim().length > 0 && keywordLength < MIN_SEARCH_LENGTH; // typed something, but too little

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => dispatch(setSearchInput(e.target.value))}
          placeholder="Search all news..."
          maxLength={MAX_SEARCH_LENGTH}
          aria-label="Search news"
          autoComplete="off"
          className="w-full px-4 py-3 pr-16 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#104AC2] focus:border-transparent transition-all"
        />

        {/* Clear (X) button, only when something is typed */}
        {searchInput && (
          <button
            type="button"
            onClick={() => dispatch(setSearchInput(""))}
            aria-label="Clear search"
            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Magnifier icon, turns into a small spinner while a search is loading */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {searchLoading ? (
            <span className="block w-4 h-4 border-2 border-[#104AC2] border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {tooShort
          ? `Type at least ${MIN_SEARCH_LENGTH} characters to search`
          : "Searches the whole Guardian news archive"}
      </p>
    </div>
  );
}
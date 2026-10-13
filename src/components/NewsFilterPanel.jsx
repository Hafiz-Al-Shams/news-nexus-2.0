// src>components>NewsFilterPanel.jsx  (NEW)
"use client";

import { useDispatch, useSelector } from "react-redux";
import NewsFilters from "./NewsFilters";
import useGuardianNews from "@/hooks/useGuardianNews";

// The complete "Filter News" card: filters + "Get The News" button.
// Used inside the right sidebar (desktop) and inside the collapsible filter block of the news section (mobile / tablet).
export default function NewsFilterPanel() {
  const dispatch = useDispatch();
  const { filters, appliedFilters, guardianLoading, guardianLoadingMore } = useSelector(
    (state) => state.news
  );
  const { fetchGuardianNews } = useGuardianNews();

  // "Get The News" is active only when a filter differs from what is on screen (same rule as before)
  const filtersChanged =
    filters.time !== appliedFilters.time || filters.topic !== appliedFilters.topic;
  const canGetNews = filtersChanged && !guardianLoading && !guardianLoadingMore;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* Card heading with a small filter icon */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
          </svg>
        </span>
        <h2 className="text-base font-semibold text-gray-800">Filter News</h2>
      </div>

      {/* Time + category controls */}
      <NewsFilters
        currentTime={filters.time}
        currentTopic={filters.topic}
        onTimeChange={(time) => dispatch({ type: "news/setTimeFilter", payload: time })}
        onTopicChange={(topic) => dispatch({ type: "news/setTopicFilter", payload: topic })}
      />

      {/* Get The News button: disabled until a filter is changed */}
      <button
        type="button"
        onClick={fetchGuardianNews}
        disabled={!canGetNews}
        className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
      >
        {guardianLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Get The News
          </>
        )}
      </button>

      {/* Small hint while the button is disabled */}
      {!filtersChanged && !guardianLoading && (
        <p className="text-[11px] text-gray-500 text-center mt-2">
          Change the time range or category to load different news
        </p>
      )}
    </div>
  );
}
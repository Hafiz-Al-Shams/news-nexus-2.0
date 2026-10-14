// src>components>layout>RightSidebar.jsx  (MODIFIED)
"use client";

import Link from "next/link"; // used for the newsletter link at the bottom
import ThemeToggle from "@/components/ThemeToggle"; // the switch lives in this sidebar
import NewsFilterPanel from "@/components/NewsFilterPanel"; // filters + "Get The News"
import SearchBox from "@/components/SearchBox"; // NEW: the real, debounced search box
import ReviewsPanel from "@/components/ReviewsPanel"; // NEW: dynamic reviews (replaces the placeholder reviews)

export default function RightSidebar() {
  return (
    // min-h-0 lets the middle area scroll while the search bar (top) and newsletter (bottom) stay pinned
    <div className="flex flex-col h-full min-h-0">
      {/* 1) Search bar: pinned at the top of the sidebar (sticky). Results appear in the middle column. */}
      <div className="shrink-0 sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
        <SearchBox />
      </div>

      {/* 2) Scrollable area: theme switch -> filters -> reviews */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {/* Dark / light mode switch: directly below the search bar, above the filters */}
        <ThemeToggle variant="inline" />

        {/* Filter News + Get The News button */}
        <NewsFilterPanel />

        {/* User Reviews: 3 permanent reviews + approved ones, average rating, "Add Review" button */}
        <ReviewsPanel />
      </div>

      {/* 3) Newsletter Subscribe Button: pinned at the bottom (same position as before) */}
      <div className="shrink-0 border-t border-gray-200 p-5 bg-white">
        <Link
          href="/newsletter"
          className="block w-full px-6 py-3 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors font-semibold text-sm text-center shadow-md hover:shadow-lg"
        >
          Subscribe to Our Newsletter
        </Link>
        <p className="text-xs text-gray-500 text-center mt-2">
          Get daily news updates in your inbox
        </p>
      </div>
    </div>
  );
}
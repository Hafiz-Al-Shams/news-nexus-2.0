// src>components>layout>RightSidebar.jsx  (MODIFIED)
"use client";

import { useState } from "react";
import Link from "next/link"; // used for the newsletter link at the bottom
import ThemeToggle from "@/components/ThemeToggle"; // NEW: the switch now lives in this sidebar
import NewsFilterPanel from "@/components/NewsFilterPanel"; // NEW: filters + "Get The News" moved here

export default function RightSidebar() {
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder reviews data
  const placeholderReviews = [
    { id: 1, name: "John Doe", rating: 5, comment: "Great news platform!" },
    { id: 2, name: "Jane Smith", rating: 4, comment: "Very informative" },
    { id: 3, name: "Mike Johnson", rating: 5, comment: "Love the AI summaries" },
    { id: 4, name: "Sarah Williams", rating: 4, comment: "Excellent service" },
  ];

  return (
    // min-h-0 lets the middle area scroll while the search bar (top) and newsletter (bottom) stay pinned
    <div className="flex flex-col h-full min-h-0">
      {/* 1) Search bar: pinned at the top of the sidebar (sticky) */}
      <div className="shrink-0 sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled
            className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-400 cursor-not-allowed focus:outline-none"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-xs text-gray-500 mt-2">Search feature coming soon</p>
      </div>

      {/* 2) Scrollable area: theme switch -> filters -> reviews */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {/* Dark / light mode switch: directly below the search bar, above the filters */}
        <ThemeToggle variant="inline" />

        {/* Filter News + Get The News button */}
        <NewsFilterPanel />

        {/* User Reviews: at the bottom of the filters */}
        <section>
          <div className="mt-8 mb-3">
            <h3 className="text-base font-semibold text-gray-800">User Reviews</h3>
          </div>

          <div className="space-y-3">
            {placeholderReviews.map((review) => (
              <div
                key={review.id}
                className="bg-gradient-to-br from-gray-50 to-white p-3.5 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar with the first letter of the reviewer name */}
                  <div className="w-9 h-9 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {review.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800 text-sm truncate">{review.name}</p>
                      {/* Star rating */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1.5">2 days ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* More Reviews Placeholder (skeleton rows) */}
          <div className="mt-4 space-y-3 opacity-50">
            {[1, 2].map((item) => (
              <div key={item} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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
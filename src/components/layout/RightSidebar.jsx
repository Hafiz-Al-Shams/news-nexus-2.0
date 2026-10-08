"use client";

import { useState } from "react";

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
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled
            className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none"
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

      {/* User Reviews Section */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Reviews</h3>
        <div className="space-y-4">
          {placeholderReviews.map((review) => (
            <div
              key={review.id}
              className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {review.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {review.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">2 days ago</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More Reviews Placeholder */}
        <div className="mt-6 space-y-4 opacity-50">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Subscribe Button */}
      <div className="border-t border-gray-200 p-6">
        <button className="w-full px-6 py-3 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors font-semibold text-sm shadow-md hover:shadow-lg">
          Subscribe to Our Newsletter
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Get daily news updates in your inbox
        </p>
      </div>
    </div>
  );
}
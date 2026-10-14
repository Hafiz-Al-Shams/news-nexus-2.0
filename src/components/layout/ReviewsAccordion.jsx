// src>components>layout>ReviewsAccordion.jsx  (MODIFIED)
"use client";

import { useState } from "react";
import ReviewsPanel, { RatingBadge } from "../ReviewsPanel"; // NEW: same dynamic reviews as the desktop sidebar

export default function ReviewsAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Accordion Header (the calculated rating is visible even when the accordion is closed) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[#104AC2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">User Reviews</h3>
          <RatingBadge />
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accordion Content (taller limit, because the list can now hold up to 23 reviews) */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-6 pb-5 border-t border-gray-200">
          {/* showHeader={false}: this accordion already has its own header above */}
          <div className="-mt-6">
            <ReviewsPanel showHeader={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
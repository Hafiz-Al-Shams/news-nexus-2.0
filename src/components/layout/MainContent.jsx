// src>components>layout>MainContent.jsx  (MODIFIED)
"use client";

import TimeBar from "@/components/TimeBar"; // NEW: world time bar

export default function MainContent({ children }) {
  return (
    <div className="min-h-full">
      {/* NEW: sticky time bar, placed outside the padded box so it uses the FULL width of the middle column */}
      <TimeBar />

      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
}
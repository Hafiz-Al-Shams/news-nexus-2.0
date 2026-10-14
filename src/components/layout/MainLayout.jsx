// src>components>layout>MainLayout.jsx  (MODIFIED)
"use client";

import { useRef } from "react"; // NEW: lets us point at the scrolling middle column
import BackToTopButton from "./BackToTopButton"; // NEW: the back to top button

export default function MainLayout({ leftSidebar, mainContent, rightSidebar }) {
  const mainScrollRef = useRef(null); // NEW: reference to the middle column's scrolling <main> element

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar - Hidden on mobile, reduced width on tablet, normal on desktop */}
      <aside className="hidden md:block md:w-50 lg:w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        {leftSidebar}
      </aside>

      {/* NEW: wrapper for the middle column. "relative" makes the back to top button position itself
          inside THIS column only, and the button stays fixed while the <main> inside it scrolls */}
      <div className="relative flex-1 min-w-0 h-full">
        {/* Main Content - Always visible, flexible width (this is the element that scrolls) */}
        <main ref={mainScrollRef} className="h-full overflow-y-auto bg-gray-50">
          {mainContent}
        </main>

        {/* NEW: back to top button, scrolls only the middle column's <main> */}
        <BackToTopButton scrollRef={mainScrollRef} />
      </div>

      {/* Right Sidebar - Only visible on large screens */}
      <aside className="hidden lg:block w-[32rem] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        {rightSidebar}
      </aside>
    </div>
  );
}
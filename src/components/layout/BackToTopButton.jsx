// src>components>layout>BackToTopButton.jsx  (MODIFIED)
"use client";

import { useEffect, useState } from "react";

// How far (in pixels) the middle column must be scrolled before the button appears
const SHOW_AFTER_PX = 400;

// Floating "Back to top" button for the MIDDLE column only.
// It receives a ref to the scrolling <main> element from MainLayout, so it only scrolls that column
// (the left and right sidebars are separate scroll areas and are never touched).
export default function BackToTopButton({ scrollRef }) {
  const [visible, setVisible] = useState(false); // true once the user has scrolled down far enough

  useEffect(() => {
    const el = scrollRef.current; // the scrolling middle column
    if (!el) return;

    const onScroll = () => setVisible(el.scrollTop > SHOW_AFTER_PX); // show/hide based on the column's own scroll position

    onScroll(); // set the correct state right away
    el.addEventListener("scroll", onScroll, { passive: true }); // passive = no scroll performance cost

    return () => el.removeEventListener("scroll", onScroll); // clean up when the component disappears
  }, [scrollRef]);

  // Smoothly scrolls ONLY the middle column back to its top
  const handleClick = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1} // hidden button must not be reachable with the keyboard
      // absolute (not fixed) = positioned inside the middle column's wrapper, never over the sidebars
      // bottom-24 on phones because the mobile header pushes the layout below the screen edge; md:bottom-6 from tablets up
      // CHANGED: right-4 md:right-6 puts the button in the bottom-right corner of the middle column (was left-1/2 -translate-x-1/2 = centered)
      className={`absolute bottom-24 md:bottom-6 right-4 md:right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none" // fade + slide in/out
      }`}
    >
      {/* Arrow-up icon */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
      Back to top
    </button>
  );
}
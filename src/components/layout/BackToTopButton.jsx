// src>components>layout>BackToTopButton.jsx  (MODIFIED)
"use client";

import { useEffect, useState } from "react";

// How far (in pixels) the page / column must be scrolled before the button appears
const SHOW_AFTER_PX = 400;

// Floating "Back to top" button with TWO modes:
//  1) Column mode (homepage): a scrollRef to the scrolling <main> is passed, so only that middle column scrolls
//     (the left and right sidebars are separate scroll areas and are never touched). UNCHANGED behavior.
//  2) Window mode (bulletin pages): NO scrollRef is passed, so the whole page (window) is scrolled
//     and the button is positioned with "fixed".
export default function BackToTopButton({ scrollRef }) {
  const [visible, setVisible] = useState(false); // true once the user has scrolled down far enough
  const isWindowMode = !scrollRef; // NEW: no ref given = follow the window scroll

  useEffect(() => {
    // The element that scrolls: the whole window, or the middle column
    const target = isWindowMode ? window : scrollRef.current;
    if (!target) return;

    // Current scroll position of that element
    const getScrollTop = () => (isWindowMode ? window.scrollY : target.scrollTop);

    const onScroll = () => setVisible(getScrollTop() > SHOW_AFTER_PX); // show/hide based on its own scroll position

    onScroll(); // set the correct state right away
    target.addEventListener("scroll", onScroll, { passive: true }); // passive = no scroll performance cost

    return () => target.removeEventListener("scroll", onScroll); // clean up when the component disappears
  }, [scrollRef, isWindowMode]);

  // Smoothly scrolls ONLY the right area back to its top (window or middle column)
  const handleClick = () => {
    if (isWindowMode) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Column mode: absolute (not fixed) = positioned inside the middle column's wrapper, never over the sidebars
  //   (bottom-24 on phones because the mobile header pushes the layout below the screen edge; md:bottom-6 from tablets up)
  // Window mode: fixed to the screen. On phones / tablets it sits to the LEFT of the round chat button (right-20 / md:right-24)
  //   so the two never overlap; on large screens the chat button is higher up, so the corner (lg:right-6) is free.
  const positionClass = isWindowMode
    ? "fixed bottom-6 right-20 md:bottom-10 md:right-24 lg:bottom-50 lg:right-50"
    : "absolute bottom-24 md:bottom-6 right-4 md:right-6";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1} // hidden button must not be reachable with the keyboard
      className={`${positionClass} z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ${
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
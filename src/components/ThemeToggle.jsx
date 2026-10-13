// src>components>ThemeToggle.jsx  (MODIFIED)
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation"; // NEW: lets the floating button know which page it is on

const STORAGE_KEY = "theme"; // localStorage key that remembers the choice ("dark" or "light")

// Light/dark toggle with two looks:
//  - variant="inline"   -> a switch row, used inside the right sidebar (below the search bar)
//  - variant="floating" -> the round floating button rendered by layout.js on every page (default)
export default function ThemeToggle({ variant = "floating" }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false); // avoids a server/client mismatch for the icon
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncFromPage = () => setIsDark(root.classList.contains("dark")); // read the real theme from <html>

    syncFromPage();
    setMounted(true);

    // NEW: when ANY toggle changes the "dark" class, every toggle on the page updates itself
    // (needed because the sidebar switch and the floating button can both exist on the page)
    const observer = new MutationObserver(syncFromPage);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Keep several open tabs in sync when the theme is changed in one of them
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      const dark = e.newValue === "dark";
      root.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next); // the "dark" class on <html> switches all colors
    setIsDark(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light"); // remember the choice for the next visit
    } catch {
      // storage blocked (private mode): the theme still works until the page is closed
    }
  };

  // ---------- Sidebar look: a full-width switch row ----------
  if (variant === "inline") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#104AC2] transition-colors"
      >
        <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
          {mounted && isDark ? (
            // Sun icon (dark mode is on)
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            // Moon icon (light mode is on)
            <svg className="w-5 h-5 text-[#104AC2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {mounted && isDark ? "Dark mode" : "Light mode"}
        </span>

        {/* Switch track + knob (knob uses a fixed white so dark mode's bg-white remap never darkens it) */}
        <span
          className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 ${
            mounted && isDark ? "bg-[#104AC2]" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#ffffff] shadow transition-transform duration-200 ${
              mounted && isDark ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    );
  }

  // ---------- Floating look (all other pages, and the home page below the "lg" breakpoint) ----------
  // On the home page at large screens the sidebar switch is used instead, so the floating button is hidden there.
  const hideOnLargeHome = pathname === "/" ? "lg:hidden" : "";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      // bottom offsets keep it just above the floating chat button on mobile / tablet / desktop
      className={`fixed bottom-24 right-4 md:bottom-36 md:right-6 lg:bottom-52 z-30 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center text-gray-700 hover:scale-110 active:scale-95 transition-all duration-200 ${hideOnLargeHome}`}
    >
      {mounted &&
        (isDark ? (
          // Sun icon (shown in dark mode, click to go light)
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          // Moon icon (shown in light mode, click to go dark)
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ))}
    </button>
  );
}
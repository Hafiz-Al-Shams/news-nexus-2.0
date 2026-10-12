"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme"; // localStorage key that remembers the choice ("dark" or "light")

// Floating light/dark toggle button, rendered once in layout.js so it appears on EVERY page
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false); // avoids a server/client mismatch for the icon
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // The <head> script in layout.js has already set the class, so just read it
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    // Keep several open tabs in sync when the theme is changed in one of them
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      const dark = e.newValue === "dark";
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      // bottom offsets keep it just above the floating chat button on mobile / tablet / desktop
      className="fixed bottom-24 right-4 md:bottom-36 md:right-6 lg:bottom-52 z-30 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center text-gray-700 hover:scale-110 active:scale-95 transition-all duration-200"
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
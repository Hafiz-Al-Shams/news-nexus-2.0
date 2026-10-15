// src>components>ChatLauncher.jsx  (NEW)
// The floating "Chat with AI" button, now rendered ONCE in layout.js so it appears on every page.
// (It used to live only inside the homepage.) It is hidden on the not-found page by a CSS rule in globals.css.
"use client";

import { useDispatch, useSelector } from "react-redux";
import { openChat } from "@/store/slices/uiSlice"; // opens the chat modal

export default function ChatLauncher() {
  const dispatch = useDispatch();
  const chatOpen = useSelector((state) => state.ui.chatOpen); // true while the chat modal is open

  // Hide the button while the modal is open (the modal appears exactly where the button was)
  if (chatOpen) return null;

  return (
    <button
      type="button"
      onClick={() => dispatch(openChat())} // opens the chat modal (same action the sidebar button uses)
      // "chat-launcher" is the hook used by globals.css to hide this button on the not-found page
      className="chat-launcher fixed bottom-6 md:bottom-10 lg:bottom-24 right-4 md:right-6 z-50 group"
      aria-label="Chat with AI"
    >
      <div className="relative">
        {/* Pulse animation ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></div>

        {/* Main button */}
        <div className="relative bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white p-3 md:p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 active:scale-95">
          {/* Chat icon */}
          <svg
            className="w-6 md:w-7 h-6 md:h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>

          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 w-3 md:w-4 h-3 md:h-4 bg-red-500 rounded-full border-2 border-white"></span>
        </div>

        {/* Tooltip (desktop only) */}
        <div className="hidden md:block absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm py-2 px-4 rounded-lg whitespace-nowrap shadow-lg">
            Chat with AI
            <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </button>
  );
}
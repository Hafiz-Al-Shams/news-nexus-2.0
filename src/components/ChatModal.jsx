// src>components>ChatModal.jsx  (MODIFIED)
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { closeChat } from "@/store/slices/uiSlice";

// CHANGED: project-focused quick-start questions (one tap sends them)
const SUGGESTIONS = [
  "How does the 24hrs bulletin work?",
  "What's in today's bulletin?",
  "What can I do without an account?",
  "How do AI summaries work?",
];

const MAX_INPUT = 500; // same limit the server enforces

// Formats the reset time in the visitor's own time zone, e.g. "Oct 16, 3:20 PM"
function formatReset(resetAt) {
  if (!resetAt) return "later";
  return new Date(resetAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.chatOpen); // true when a button asked to open the chat
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const firstName = session?.user?.name?.split(" ")[0] || ""; // used in the greeting

  // Chat state (lives here, so the conversation is kept while the modal is closed and reopened)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // NEW: quota info from the SERVER ({ remaining, limit, resetAt }). Clearing the chat never touches it.
  const [quota, setQuota] = useState(null);
  // NEW: true when the global daily limit was hit ("temporarily unavailable")
  const [globalBlocked, setGlobalBlocked] = useState(false);

  // NEW: derived flags that lock the input
  const limitReached = quota !== null && quota.remaining <= 0;
  const inputBlocked = limitReached || globalBlocked;

  // Two flags make the open/close animation smooth:
  // "render" keeps the modal in the page, "shown" plays the slide + fade transition
  const [render, setRender] = useState(false);
  const [shown, setShown] = useState(false);

  // NEW: loads the quota WITHOUT consuming it
  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chat/usage", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setQuota({ remaining: data.remaining, limit: data.limit, resetAt: data.resetAt });
      }
    } catch {
      // the counter simply stays hidden if this fails; the server still enforces the limit
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRender(true); // put the modal in the page...
      const t = setTimeout(() => setShown(true), 20); // ...then animate it in on the next frame
      return () => clearTimeout(t);
    }
    setShown(false); // animate out...
    const t = setTimeout(() => setRender(false), 250); // ...then remove it after the animation
    return () => clearTimeout(t);
  }, [isOpen]);

  // NEW: every time the modal opens for a logged-in user, load the counter (and forget an old "unavailable" state)
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setGlobalBlocked(false);
      loadUsage();
    }
  }, [isOpen, isLoggedIn, loadUsage]);

  // NEW: when the limit is reached, reload the usage automatically right after the reset time, so the input unlocks by itself
  useEffect(() => {
    if (!isOpen || !isLoggedIn || !limitReached || !quota?.resetAt) return;
    const delay = Math.max(new Date(quota.resetAt).getTime() - Date.now() + 1500, 1000);
    const t = setTimeout(loadUsage, delay);
    return () => clearTimeout(t);
  }, [isOpen, isLoggedIn, limitReached, quota?.resetAt, loadUsage]);

  // Close with the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") dispatch(closeChat());
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, dispatch]);

  // Focus the input when the modal opens (only possible for logged-in users with messages left)
  useEffect(() => {
    if (shown && isLoggedIn && !inputBlocked) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [shown, isLoggedIn, inputBlocked]);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, shown]);

  // When the user logs out, wipe the conversation (and the counter) so the next person never sees it
  useEffect(() => {
    if (status === "unauthenticated") {
      setMessages([]);
      setInput("");
      setQuota(null);
      setGlobalBlocked(false);
    }
  }, [status]);

  const handleClose = () => dispatch(closeChat());

  // Sends a message (the typed text, or a suggestion chip text passed in)
  const sendMessage = async (override) => {
    const text = (typeof override === "string" ? override : input).trim();
    if (!text || loading || inputBlocked) return; // CHANGED: also blocked while the limit is reached

    const userMessage = { role: "user", content: text };

    // Update UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto"; // shrink the box back after sending
    setLoading(true);

    try {
      // The API expects {role: "user"/"assistant", content: "text"}. Only the last 6 are sent (the server also trims).
      const history = messages.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await response.json().catch(() => ({}));

      // CHANGED: keep the server's error code, so 429 limits get their own friendly handling
      if (!response.ok || !data.success) {
        const err = new Error(data.error || `HTTP error! status: ${response.status}`);
        err.code = data.code;
        err.data = data;
        throw err;
      }

      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        // NEW: update the counter from every successful answer
        if (typeof data.remaining === "number") {
          setQuota({ remaining: data.remaining, limit: data.limit, resetAt: data.resetAt });
        }
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error.message);

      // Remove the user message if the request failed
      setMessages((prev) => prev.slice(0, -1));

      if (error.code === "USER_LIMIT") {
        // NEW: personal daily limit reached -> the banner below the chat explains it, no generic toast
        setQuota({
          remaining: 0,
          limit: error.data?.limit ?? quota?.limit ?? null,
          resetAt: error.data?.resetAt ?? null,
        });
      } else if (error.code === "GLOBAL_LIMIT") {
        // NEW: all users together used today's budget
        setGlobalBlocked(true);
      } else {
        // The server refunded the message, so the counter does not change
        if (error.message.includes("Unauthorized")) {
          toast.error("Please login to use AI chat");
        } else {
          toast.error(error.message || "Failed to get AI response");
        }
        setInput(text); // give the text back so nothing is lost
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clearing the chat only empties the screen. The quota lives on the server, so it is NOT reset.
  const clearChat = () => {
    if (messages.length === 0) return;
    if (confirm("Are you sure you want to clear the chat history? (Your daily message limit is not reset.)")) {
      setMessages([]);
      toast.success("Chat cleared");
    }
  };

  if (!render) return null; // nothing in the page while the modal is closed

  return (
    <>
      {/* Dim backdrop: phones only (on desktop the page stays visible and usable behind the small modal) */}
      <div
        className={`md:hidden fixed inset-0 z-[59] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* The modal: bottom sheet on phones, floating card in the bottom-right corner on larger screens */}
      <section
        role="dialog"
        aria-label="NewsNexus AI Assistant"
        className={`fixed z-[60] bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[400px] h-[88dvh] md:h-[620px] md:max-h-[calc(100dvh-3rem)] flex flex-col bg-white rounded-t-3xl md:rounded-3xl border border-gray-200 shadow-2xl overflow-hidden origin-bottom-right transition-all duration-300 ease-out ${
          shown ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
        }`}
      >
        {/* ===== Header (brand gradient) ===== */}
        <header className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white flex-shrink-0">
          <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            {/* Sparkle icon marks this as the AI */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold leading-tight">Get help with AI</h2>
            <p className="text-xs text-white/75">Fast answers. Powered by AI.</p>
          </div>

          {/* Clear chat (only when there are messages) */}
          {isLoggedIn && messages.length > 0 && (
            <button
              onClick={clearChat}
              aria-label="Clear chat"
              title="Clear chat"
              className="w-9 h-9 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Close chat"
            title="Close"
            className="w-9 h-9 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* ===== Body ===== */}
        {status === "loading" ? (
          // Session still unknown: neutral spinner (never flashes the login message to a logged-in user)
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !isLoggedIn ? (
          // ----- LOGGED OUT: login message only, no input field -----
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-gray-50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] flex items-center justify-center mb-5 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login to chat with NewsNexus Assistant</h3>
            <p className="text-sm text-gray-600 mb-6">
              Sign in to ask questions about NewsNexus and get today&apos;s news explained.
            </p>
            <Link
              href="/login"
              onClick={handleClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-xl hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              Login
            </Link>
            <p className="text-sm text-gray-600 mt-4">
              New here?{" "}
              <Link
                href="/signup"
                onClick={handleClose}
                className="text-[#104AC2] hover:text-[#1C3B7A] font-medium transition-colors"
              >
                Create your account
              </Link>
            </p>
          </div>
        ) : (
          // ----- LOGGED IN: conversation + input -----
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5 space-y-4">
              {messages.length === 0 ? (
                // Empty state with greeting and quick questions
                <div className="h-full flex flex-col items-center justify-center text-center px-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] flex items-center justify-center mb-4 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {firstName ? `Hi ${firstName}, how can I help?` : "Hi there, how can I help?"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">Ask me about NewsNexus or today&apos;s bulletin, or try one of these:</p>
                  <div className="w-full space-y-2">
                    {SUGGESTIONS.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => sendMessage(text)}
                        disabled={inputBlocked || loading} // CHANGED: chips are locked too when the limit is reached
                        className="w-full text-left px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-[#104AC2] hover:text-[#104AC2] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {/* Small AI avatar next to assistant replies */}
                      {msg.role === "assistant" && (
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </span>
                      )}
                      <div
                        className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-2xl rounded-br-md shadow-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </span>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <span className="text-xs text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-3">
              {/* NEW: limit banners (same yellow classes the project already remaps for dark mode) */}
              {limitReached && (
                <div className="mb-3 rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
                  Daily limit reached. Resets at {formatReset(quota?.resetAt)}.
                </div>
              )}
              {!limitReached && globalBlocked && (
                <div className="mb-3 rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
                  The assistant is temporarily unavailable. Please try again later.
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputBlocked ? "Chat is paused" : "How can I help?"} // CHANGED: placeholder follows the state
                  disabled={loading || inputBlocked} // CHANGED: also disabled when the limit is reached
                  maxLength={MAX_INPUT} // the server enforces the same 500 limit
                  rows={1}
                  className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104AC2] focus:border-transparent disabled:opacity-60 resize-none overflow-y-auto transition-all"
                  style={{ minHeight: "46px", maxHeight: "120px" }}
                  onInput={(e) => {
                    // Auto-resize the box while typing
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
                {/* Round send button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || inputBlocked || !input.trim()} // CHANGED: locked when the limit is reached
                  aria-label="Send message"
                  className="w-[46px] h-[46px] flex-shrink-0 rounded-xl bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white flex items-center justify-center hover:from-[#153163] hover:to-[#0d3a9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </div>

              {/* NEW: message counter + disclaimer */}
              <p className="text-[11px] text-gray-500 text-center mt-2">
                {quota && (
                  <span className="font-medium">
                    {quota.remaining} of {quota.limit} messages left
                  </span>
                )}
                {quota && " · "}
                AI can make mistakes. Double-check for accuracy.
              </p>
            </div>
          </>
        )}
      </section>
    </>
  );
}
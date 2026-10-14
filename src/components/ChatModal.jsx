"use client";

import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { closeChat } from "@/store/slices/uiSlice";

// Quick-start questions shown in the empty chat (one tap sends them)
const SUGGESTIONS = [
  "Summarize today's top news",
  "Explain a news topic simply",
  "What's happening in technology?",
];

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

  // Two flags make the open/close animation smooth:
  // "render" keeps the modal in the page, "shown" plays the slide + fade transition
  const [render, setRender] = useState(false);
  const [shown, setShown] = useState(false);

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

  // Close with the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") dispatch(closeChat());
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, dispatch]);

  // Focus the input when the modal opens (only possible for logged-in users)
  useEffect(() => {
    if (shown && isLoggedIn) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [shown, isLoggedIn]);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, shown]);

  // When the user logs out, wipe the conversation so the next person never sees it
  useEffect(() => {
    if (status === "unauthenticated") {
      setMessages([]);
      setInput("");
    }
  }, [status]);

  const handleClose = () => dispatch(closeChat());

  // Sends a message (the typed text, or a suggestion chip text passed in)
  const sendMessage = async (override) => {
    const text = (typeof override === "string" ? override : input).trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };

    // Update UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto"; // shrink the box back after sending
    setLoading(true);

    try {
      // The API expects {role: "user"/"assistant", content: "text"}
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Remove the user message if the request failed
      setMessages((prev) => prev.slice(0, -1));

      if (error.message.includes("Unauthorized")) {
        toast.error("Please login to use AI chat");
      } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
        toast.error("Service temporarily unavailable. Please try again later.");
      } else {
        toast.error(error.message || "Failed to get AI response");
      }

      setInput(text); // give the text back so nothing is lost
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

  const clearChat = () => {
    if (messages.length === 0) return;
    if (confirm("Are you sure you want to clear the chat history?")) {
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
              Sign in to ask questions, get news explained simply and chat with our AI.
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
                  <p className="text-sm text-gray-600 mb-5">Ask me anything about the news, or try one of these:</p>
                  <div className="w-full space-y-2">
                    {SUGGESTIONS.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => sendMessage(text)}
                        className="w-full text-left px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-[#104AC2] hover:text-[#104AC2] hover:shadow-sm transition-all"
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
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="How can I help?" // requested placeholder
                  disabled={loading}
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
                  disabled={loading || !input.trim()}
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
              {/* Requested disclaimer under the input */}
              <p className="text-[11px] text-gray-500 text-center mt-2">
                AI can make mistakes. Double-check for accuracy.
              </p>
            </div>
          </>
        )}
      </section>
    </>
  );
}
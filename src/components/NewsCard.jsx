// src>components>NewsCard.jsx  (MODIFIED)
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react"; // to know if the visitor is logged in
import { useRouter } from "next/navigation"; // to send logged-out visitors to the login page
import toast from "react-hot-toast"; // to show the "please login" message
import SummaryModal from "./SummaryModal";

export default function NewsCard({ article }) {
  const router = useRouter();
  const { status } = useSession(); // "authenticated" | "unauthenticated" | "loading"
  const [imageError, setImageError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Behavior is unchanged: AI summaries still need a login. Only the button LABEL is now the same for everyone.
  const handleSummarizeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Logged-out visitors are still sent to the login page when they click
    if (status === "unauthenticated") {
      toast.error("Please login to use AI summaries");
      router.push("/login");
      return;
    }

    // Session still loading, ignore the click instead of guessing
    if (status === "loading") return;

    setShowModal(true); // logged-in users open the summary modal as before
  };

  return (
    <>
      <div className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border border-gray-200 hover:border-[#104AC2]">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-200">
          {article.urlToImage && !imageError ? (
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
          )}

          {/* Source Badge */}
          {article.source?.name && (
            <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
              {article.source.name}
            </div>
          )}
        </div>

        {/* Content (flex-1 so the buttons of all cards in a row line up at the bottom) */}
        <div className="flex flex-col flex-1 p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 leading-snug">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {article.description}
            </p>
          )}

          {/* Footer: time + author */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 mt-auto">
            <span>{formatDate(article.publishedAt)}</span>
            {article.author && (
              <span className="truncate ml-2">By {article.author}</span>
            )}
          </div>

          {/* Action Buttons: one outline button + one filled button; wraps on very narrow cards */}
          <div className="flex flex-wrap gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[110px] px-3 py-2 bg-white text-[#104AC2] border border-[#104AC2] text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors text-center"
            >
              View Original
            </a>
            <button
              type="button"
              onClick={handleSummarizeClick}
              className="flex-1 min-w-fit px-3 py-2 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white text-sm font-medium leading-none whitespace-nowrap rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-1.5"
            >
              {/* Sparkle icon marks this as the AI action */}
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Summarize with AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Modal (only ever opened for logged-in users) */}
      <SummaryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        article={article}
      />
    </>
  );
}
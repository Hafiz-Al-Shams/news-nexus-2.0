"use client";

import { useState } from "react";
import SummaryModal from "./SummaryModal";

export default function NewsCard({ article }) {
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

  const handleSummarizeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <div className="group block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-[#104AC2]">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-200">
          {article.urlToImage && !imageError ? (
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
              {article.source.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {article.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{formatDate(article.publishedAt)}</span>
            {article.author && (
              <span className="truncate ml-2">By {article.author}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white text-sm font-medium rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-colors text-center"
            >
              View Original
            </a>
            <button
              onClick={handleSummarizeClick}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#104AC2] to-[#1C3B7A] text-white text-sm font-medium rounded-lg hover:from-[#0d3a9f] hover:to-[#153163] transition-all text-center"
            >
              Summarize with AI
            </button>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        article={article}
      />
    </>
  );
}
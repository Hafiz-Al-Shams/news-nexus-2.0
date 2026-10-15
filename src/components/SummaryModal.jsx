"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SpeakButton from "./SpeakButton"; // text to speech button
import AddReviewButton from "./AddReviewButton"; // NEW: the same review button + pop-up used everywhere

export default function SummaryModal({
  isOpen,
  onClose,
  article,
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  // REMOVED: showReview / rating / comment / submittingReview states and handleReviewSubmit
  // (the old inline review form is gone, AddReviewButton handles everything now)

  useEffect(() => {
    if (isOpen && article) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, article]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/summarize-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          url: article.url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("Summary error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSummary(null); // summary is cleared, so the SpeakButton below unmounts and the voice stops automatically
    setError(null);
    onClose();
  };

  if (!isOpen) return null; // also unmounts the review pop-up if it was still open

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // also blocks clicks coming from the review pop-up from closing this modal
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-600">AI Summary</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 text-lg font-medium animate-pulse">
                generative AI is working...
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Analyzing and summarizing the article
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-lg font-semibold text-red-800 mb-2">Failed to Generate Summary</h4>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchSummary}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {summary && !loading && !error && (
            <div className="space-y-6">
              {/* Summary Title */}
              <div>
                <p className="text-xl font-bold text-gray-800 leading-tight">
                  {summary.title}
                </p>
              </div>

              {/* Summary Content */}
              <div>
                {/* "Summary:" label and the Listen button share one row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-medium text-gray-500">Summary:</h4>
                  {/* Reads the headline + summary aloud (button hides itself if the browser has no speech support) */}
                  <SpeakButton text={[summary.title, summary.content]} label="Listen" />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {summary.content}
                </p>
              </div>

              {/* Bottom buttons.
                  CHANGED: "Add Review" opens the SAME pop-up as the right sidebar (z-[70], above this modal).
                  The review waits for admin approval; closing it leaves this summary modal open. */}
              <div className="flex gap-3">
                <AddReviewButton className="flex-1 py-3 px-6" />
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
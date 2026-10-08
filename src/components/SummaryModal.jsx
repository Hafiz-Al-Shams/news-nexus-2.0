"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function SummaryModal({ 
  isOpen, 
  onClose, 
  article,
  onReviewSubmit 
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (isOpen && article) {
      fetchSummary();
    }
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

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmittingReview(true);
    
    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          articleUrl: article.url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Success - show message and close after delay
      alert("Thank you for your feedback!");
      setShowReview(false);
      setRating(0);
      setComment("");
      
      if (onReviewSubmit) {
        onReviewSubmit(data);
      }
    } catch (err) {
      console.error("Review error:", err);
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleClose = () => {
    setShowReview(false);
    setRating(0);
    setComment("");
    setSummary(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
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
                {/* <h4 className="text-sm font-medium text-gray-500 mb-2">Summary Title</h4> */}
                <p className="text-xl font-bold text-gray-800 leading-tight">
                  {summary.title}
                </p>
              </div>

              {/* Summary Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Summary:</h4>
                <p className="text-gray-700 leading-relaxed">
                  {summary.content}
                </p>
              </div>

              {/* Original Article Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Original Article</h4>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500">
                  Source: {article.source?.name || "Unknown"}
                </p>
              </div>

              {/* Review Section */}
              {!showReview ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReview(true)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                  >
                    Review Us
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Leave a Review</h4>
                  
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating (1-5)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRating(num)}
                          className={`w-12 h-12 rounded-lg font-bold transition-all ${
                            rating >= num
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.length}/500 characters
                    </p>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleReviewSubmit}
                      disabled={submittingReview || rating === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      onClick={() => setShowReview(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
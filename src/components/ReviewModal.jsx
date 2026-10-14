// src>components>ReviewModal.jsx  (NEW)
// Pop-up where a logged-in user writes a review. Submit sends it to the admin for approval, Cancel closes it.
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const MIN_COMMENT = 10;   // same rule as the server
const MAX_COMMENT = 500;

export default function ReviewModal({ isOpen, onClose }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); // stars light up while hovering
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Close with the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Empties the form and closes the modal
  const handleClose = () => {
    if (submitting) return; // do not close in the middle of sending
    setRating(0);
    setHoverRating(0);
    setComment("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (comment.trim().length < MIN_COMMENT) {
      toast.error(`Please write at least ${MIN_COMMENT} characters`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          reviewType: "general", // "general" = the public review that needs admin approval
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit review");

      toast.success("Thank you! Your review will appear after admin approval.");
      setSubmitting(false);
      setRating(0);
      setHoverRating(0);
      setComment("");
      onClose();
    } catch (err) {
      console.error("Review error:", err);
      toast.error(err.message || "Failed to submit review");
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose} // click on the dark area closes the modal
    >
      <div
        role="dialog"
        aria-label="Add a review"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // clicks inside the modal must not close it
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Add a Review</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Posting as <span className="font-semibold text-gray-800">{session?.user?.name || session?.user?.email}</span>.
            Your review will be shown after an admin approves it.
          </p>

          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  onMouseEnter={() => setHoverRating(num)}
                  aria-label={`${num} star${num > 1 ? "s" : ""}`}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <svg
                    className={`w-9 h-9 transition-colors ${(hoverRating || rating) >= num ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your review *
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think about NewsNexus..."
              rows={4}
              maxLength={MAX_COMMENT}
              disabled={submitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104AC2] resize-none text-sm disabled:opacity-60"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/{MAX_COMMENT} characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#104AC2] to-[#1C3B7A] text-white rounded-xl hover:from-[#0d3da3] hover:to-[#152f61] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body); // rendered on top of everything, outside the sidebar
}
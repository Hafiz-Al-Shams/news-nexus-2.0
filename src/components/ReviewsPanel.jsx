// src>components>ReviewsPanel.jsx  (MODIFIED)
// The whole review section: list (3 permanent reviews first), calculated average, and the "Add Review" button.
// Used by the right sidebar (desktop) AND the mobile accordion.
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews } from "@/store/slices/reviewsSlice";
import AddReviewButton from "./AddReviewButton"; // CHANGED: the shared button (login check + pop-up live there now)

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

// Turns a date into "Just now", "5m ago", "3h ago", "2d ago" or a full date
function formatReviewDate(dateString) {
  if (!dateString) return null; // the 3 permanent reviews have no date
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// Small "★ 4.7 (12)" badge. Exported so the mobile accordion header can show it too.
export function RatingBadge() {
  const { average, count } = useSelector((state) => state.reviews);

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold">
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d={STAR_PATH} />
      </svg>
      {average.toFixed(1)}
      <span className="text-xs font-normal text-gray-500">({count})</span>
    </span>
  );
}

// showHeader=false is used inside the mobile accordion (it has its own header)
export default function ReviewsPanel({ showHeader = true }) {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.reviews);

  // Load the reviews once (the second panel on the page is skipped automatically by the thunk's condition)
  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  return (
    <section>
      {/* Header: title on the left, calculated rating on the top-right corner */}
      {showHeader && (
        <div className="mt-8 mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800">User Reviews</h3>
          <RatingBadge />
        </div>
      )}

      {/* Review list: the 3 permanent reviews first, approved user reviews after them */}
      <div className="space-y-3">
        {items.map((review) => {
          const when = formatReviewDate(review.createdAt);
          return (
            <div
              key={review.id}
              className="bg-gradient-to-br from-gray-50 to-white p-3.5 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Avatar with the first letter of the reviewer name */}
                <div className="w-9 h-9 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {review.userName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-gray-800 text-sm truncate">{review.userName}</p>
                    {/* Star rating */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d={STAR_PATH} />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 break-words">{review.comment}</p>
                  {when && <p className="text-xs text-gray-400 mt-1.5">{when}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Add review" button at the end of the list (same shared button + pop-up as every other page) */}
      <div className="mt-4">
        <AddReviewButton className="w-full" />
        {loading && <p className="text-[11px] text-gray-400 text-center mt-2">Updating reviews...</p>}
      </div>
    </section>
  );
}
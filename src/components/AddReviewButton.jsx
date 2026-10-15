// src>components>AddReviewButton.jsx  (NEW)
// ONE reusable "Add Review" button + pop-up for the whole website.
// - logged in      -> real button that opens the ReviewModal (review waits for admin approval)
// - logged out     -> disabled button telling the visitor to log in
// Used by: right sidebar (ReviewsPanel), bulletin page, AI summary modal.
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ReviewModal from "./ReviewModal";

// Shared shape of the button (size / font). Extra layout classes come from the "className" prop.
const BASE_CLASS = "px-5 py-2.5 rounded-lg font-semibold text-sm";

export default function AddReviewButton({ label = "Add Review", className = "" }) {
  const { status } = useSession(); // "authenticated" | "unauthenticated" | "loading"
  const [modalOpen, setModalOpen] = useState(false); // is the review pop-up open?

  const isLoggedIn = status === "authenticated";

  // Logged-out (or session still loading): disabled button, nothing can be opened
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        disabled
        className={`${BASE_CLASS} bg-gray-200 text-gray-500 cursor-not-allowed ${className}`}
      >
        {status === "loading" ? label : "Log in to add a review"}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)} // opens the same pop-up everywhere
        className={`${BASE_CLASS} bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-md hover:shadow-lg ${className}`}
      >
        {label}
      </button>

      {/* Portal-based pop-up (z-[70]), so it always appears above any other modal, e.g. the AI summary modal */}
      <ReviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
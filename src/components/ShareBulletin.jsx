// src>components>ShareBulletin.jsx  (NEW)
// "Share this bulletin" card with Facebook, X (Twitter) and Instagram buttons.
// - Facebook / X: open their official share pop-up with the bulletin link already filled in.
// - Instagram: has no "share a link" web address, so we use the phone's native share sheet when available,
//   otherwise we copy the link and open Instagram so the visitor can paste it.
"use client";

import toast from "react-hot-toast";

// The page that gets shared (short AND detailed view live on this same address)
const BULLETIN_PATH = "/bulletins/24hrs";

// Text that goes together with the link (used by X and the native share sheet)
const SHARE_TITLE = "NewsNexus - 24hrs News Bulletin";
const SHARE_TEXT = "The 12 most important world stories of the last 24 hours, summarized by AI.";

// Builds the full live link in the browser, so it is right on localhost AND on your real domain
const getShareUrl = () => `${window.location.origin}${BULLETIN_PATH}`;

// Opens a small share window (new tab on phones). "noopener" keeps the other site from controlling this page
const openShareWindow = (url) => {
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=520");
};

// True on phones / tablets, where the native share sheet really lists Instagram
const isMobileDevice = () =>
  typeof navigator !== "undefined" &&
  navigator.maxTouchPoints > 0 &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Shared look of the three round icon buttons
const iconButtonClass =
  "w-11 h-11 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 hover:scale-110 active:scale-95 transition-all duration-200";

export default function ShareBulletin() {
  // ----- Facebook -----
  const handleFacebook = () => {
    const url = encodeURIComponent(getShareUrl()); // encode, so special characters can't break the address
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  // ----- X (Twitter) -----
  const handleTwitter = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(SHARE_TEXT);
    openShareWindow(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
  };

  // ----- Instagram -----
  const handleInstagram = async () => {
    const url = getShareUrl();

    // 1) Phones: the native share sheet lets the visitor pick Instagram directly
    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return; // the visitor closed the sheet, nothing to do
        // any other error: fall through to the copy method below
      }
    }

    // 2) Desktop (or share sheet failed): copy the link, then open Instagram so it can be pasted
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! Paste it in your Instagram post, story or message.");
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Could not copy the link. Please copy it from the address bar.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <h4 className="text-lg font-semibold text-gray-800">Share this bulletin</h4>
        <p className="text-sm text-gray-600">Help your friends stay informed too</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Facebook */}
        <button type="button" onClick={handleFacebook} aria-label="Share on Facebook" title="Share on Facebook" className={iconButtonClass}>
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
          </svg>
        </button>

        {/* X (Twitter): text-gray-900 turns light automatically in dark mode */}
        <button type="button" onClick={handleTwitter} aria-label="Share on X (Twitter)" title="Share on X (Twitter)" className={iconButtonClass}>
          <svg className="w-[18px] h-[18px] text-gray-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>

        {/* Instagram */}
        <button type="button" onClick={handleInstagram} aria-label="Share on Instagram" title="Share on Instagram" className={iconButtonClass}>
          <svg className="w-5 h-5 text-[#E4405F]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
// src>components>SiteFooter.jsx  (MODIFIED)
// The ONE footer used by the bulletin page and the newsletter page, so it always looks exactly the same.
// The 6 footer labels (About Us, Careers, Help Center, Contact, Terms of Use, Privacy Policy)
// are now inactive placeholders: those pages were deleted, so the labels are plain text with no link.
"use client";

import Link from "next/link";

// Labels shown in the footer (CHANGED: no href anymore, because the pages do not exist)
const PAGE_LINKS = [
  { label: "About Us" },
  { label: "Careers" },
  { label: "Help Center" },
  { label: "Contact" },
  { label: "Terms of Use" },
  { label: "Privacy Policy" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-5">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {PAGE_LINKS.map((item) => (
            // CHANGED: a plain <span> instead of <Link>, so clicking does nothing.
            // The "active page" highlight was removed because no footer label is a page anymore.
            <span
              key={item.label}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {item.label}
            </span>
          ))}
        </nav>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#104AC2] hover:text-[#1C3B7A] transition-colors"
        >
          {/* Home icon (inline on purpose: importing Icon from StaticPageLayout would create a circular import) */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Back to NewsNexus
        </Link>

        <p className="text-xs text-gray-500 text-center">
          ©{new Date().getFullYear()} NewsNexus. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
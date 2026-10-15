// src>components>SiteFooter.jsx  (NEW)
// The ONE footer used by the static pages (About, Careers, Help, Contact, Terms, Privacy)
// AND by the bulletin page, so it always looks exactly the same.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // used to highlight the current page in the footer links

// Links shown in the footer (moved here from StaticPageLayout)
const PAGE_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/careers", label: "Careers" },
  { href: "/help", label: "Help Center" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
];

export default function SiteFooter() {
  const pathname = usePathname(); // current URL, used to highlight the active footer link

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-5">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {PAGE_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-gray-100 text-[#104AC2] font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
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
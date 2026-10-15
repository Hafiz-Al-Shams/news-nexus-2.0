// src>components>StaticPageLayout.jsx  (MODIFIED)
"use client";

import Link from "next/link";
import SiteFooter from "./SiteFooter"; // CHANGED: the footer now lives in its own shared component

// ---------- Tiny icon set (outline icons, same style as the rest of the project) ----------
// Usage: <Icon name="mail" className="w-5 h-5" />
const ICONS = {
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  globe: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  pin: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  chevronDown: "M19 9l-7 7-7-7",
  arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  document: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  sparkles: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  briefcase: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  chat: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  check: "M5 13l4 4L19 7",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  support: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
};

export function Icon({ name, className = "w-5 h-5", strokeWidth = 2 }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={ICONS[name]} />
    </svg>
  );
}

// ---------- Small heading used above each block of a page ----------
export function SectionHeading({ eyebrow, title, subtitle, center = false }) {
  return (
    <div className={center ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-[11px] font-semibold text-[#104AC2] uppercase tracking-wider mb-2">{eyebrow}</p>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-sm sm:text-base text-gray-600">{subtitle}</p>}
    </div>
  );
}

// REMOVED: PAGE_LINKS (the footer links now live in SiteFooter)

// ---------- The shared page frame ----------
// pageTitle  = small title at the top-right (same as the other pages)
// eyebrow    = tiny chip inside the hero card
// title      = big hero heading, subtitle = hero description
// widthClass = max width of the content (pass a full class like "max-w-6xl")
export default function StaticPageLayout({
  pageTitle,
  eyebrow,
  title,
  subtitle,
  children,
  widthClass = "max-w-5xl",
}) {
  return (
    <div className="min-h-screen bg-gray-50 relative flex flex-col">
      {/* Website name, top-left: links back to the NewsNexus homepage */}
      <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50" aria-label="Go to NewsNexus homepage">
        <p className="text-base lg:text-2xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </p>
      </Link>

      {/* Page title, top-right (same position as the bulletin / admin pages) */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
        <p className="text-base sm:text-lg font-semibold text-gray-800">{pageTitle}</p>
      </div>

      {/* extra top padding keeps the content clear of the logo and the page title */}
      <main className={`flex-1 w-full mx-auto px-4 pt-24 pb-16 sm:pt-28 ${widthClass}`}>
        {/* Hero card (brand gradient, same look as the bulletin page) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] p-6 sm:p-10 lg:p-14 text-white shadow-xl">
          {/* Soft decorative glows */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>

          <div className="relative max-w-2xl">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                {eyebrow}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{title}</h1>
            {subtitle && <p className="text-sm sm:text-base lg:text-lg text-white/80">{subtitle}</p>}
          </div>
        </section>

        {/* Page content */}
        <div className="mt-10 sm:mt-14 space-y-14 sm:space-y-20">{children}</div>
      </main>

      {/* CHANGED: the footer is now the shared component (identical on the bulletin page) */}
      <SiteFooter />
    </div>
  );
}
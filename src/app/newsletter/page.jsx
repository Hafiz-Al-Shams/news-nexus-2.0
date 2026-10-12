"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// Shown on the page (the send time matches the schedule in the workflow file: 01:30 UTC = 7:30 AM Dhaka)
const SEND_TIME_TEXT = "7:30 AM (Dhaka time, UTC+6)";

// Your Kit form details (from the Kit "Embed this form" screen)
const KIT_FORM_UID = "c2d8be667a";
const KIT_FORM_SCRIPT_SRC = "https://news-nexus.kit.com/c2d8be667a/index.js";

const FEATURES = [
  "Daily email with the AI-summarized bulletin: the 12 most important stories",
  `Sent once a day at ${SEND_TIME_TEXT}`,
  "Unsubscribe at any moment with the link at the bottom of every email",
];

export default function NewsletterPage() {
  const formContainerRef = useRef(null); // the Kit form will be placed inside this div

  // Loads the Kit embed script inside the container (the script draws the form where it is placed)
  useEffect(() => {
    const container = formContainerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-uid", KIT_FORM_UID); // tells Kit which form to show
    script.src = KIT_FORM_SCRIPT_SRC;
    container.appendChild(script);

    // Cleanup: remove the form when leaving the page, so it is never duplicated
    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Website Name - Top Left */}
      <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50">
        <h1 className="text-base lg:text-2xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </h1>
      </Link>

      {/* Page Title - Top Right */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Daily Newsletter</h2>
      </div>

      <main className="container mx-auto px-4 py-20 sm:py-24 max-w-3xl">
        {/* Intro card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">The NewsNexus Daily Bulletin</h3>
          <p className="text-sm sm:text-base text-gray-600">
            The day's most important news, summarized by AI and delivered to your inbox once a day.
          </p>
        </div>

        {/* Kit subscribe form (rendered by the Kit script) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Subscribe for free</h4>
          <div ref={formContainerRef} className="flex justify-center min-h-[200px]" />
          <p className="text-xs text-gray-500 text-center mt-4">
            After subscribing, check your inbox and confirm your email to start receiving the bulletin.
          </p>
        </div>

        {/* What you get */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h4 className="text-xl font-bold text-gray-900 mb-4">What you get</h4>
          <ul className="space-y-3">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-gray-700">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
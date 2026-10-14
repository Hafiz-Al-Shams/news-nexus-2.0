// src>app>help>page.jsx  (NEW)
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StaticPageLayout, { Icon } from "@/components/StaticPageLayout";

// Demo FAQ data (the answers match how the app really works)
const FAQS = [
  {
    id: 1,
    category: "Getting Started",
    q: "What is NewsNexus?",
    a: "NewsNexus is an AI-powered news aggregator. It collects fresh stories from around the world and turns them into short summaries, so you can catch up quickly.",
  },
  {
    id: 2,
    category: "Getting Started",
    q: "Do I need an account to read the news?",
    a: "No. Browsing the latest news and reading the 24hrs News Bulletin are free for everyone. An account is needed for AI article summaries, the AI chat assistant, leaving reviews and the newsletter.",
  },
  {
    id: 3,
    category: "Getting Started",
    q: "How do I filter the news by topic or time?",
    a: "Use the Filter News card (in the right sidebar on large screens, or under 'Search & Filter News' on phones and tablets). Pick a time range and a category, then press 'Get The News'.",
  },
  {
    id: 4,
    category: "AI Summaries",
    q: "How does the 24hrs News Bulletin work?",
    a: "Every few hours our system reads the top stories of the last 24 hours and AI condenses them into the 12 most important points. Tap 'Show More Details' for a fuller card on each story.",
  },
  {
    id: 5,
    category: "AI Summaries",
    q: "How do I get an AI summary of an article?",
    a: "Log in, then press 'Summarize with AI' on any news card. A short summary opens in a window, and you can press Listen to hear it read aloud.",
  },
  {
    id: 6,
    category: "AI Summaries",
    q: "Is there a limit on AI summaries?",
    a: "To keep the service fair for everyone, each account can generate up to 10 new summaries per hour and 100 per day. Summaries that were already generated for an article are shown instantly and don't count toward your limit.",
  },
  {
    id: 7,
    category: "AI Summaries",
    q: "Can the AI make mistakes?",
    a: "Yes. AI can occasionally misread or oversimplify a story. Always use 'View Original' to read the full article for anything important.",
  },
  {
    id: 8,
    category: "Account",
    q: "How do I create an account or sign in?",
    a: "Use 'Sign In' in the sidebar, then either enter your email and password or continue with Google. New here? Choose 'Create Your Account' on the sign-in page.",
  },
  {
    id: 9,
    category: "Account",
    q: "Can I switch to dark mode?",
    a: "Yes. Use the moon / sun button on any page. Your choice is remembered on this device for your next visit.",
  },
  {
    id: 10,
    category: "Newsletter",
    q: "How do I subscribe to the daily newsletter?",
    a: "Log in and open 'Subscribe to Our Newsletter'. Enter your email in the form and confirm it from the message we send you. After that, the 12 key stories arrive in your inbox once a day.",
  },
  {
    id: 11,
    category: "Newsletter",
    q: "How do I unsubscribe?",
    a: "Every newsletter email has an unsubscribe link at the bottom. Click it and you will be removed immediately.",
  },
];

const CATEGORIES = ["All", "Getting Started", "AI Summaries", "Account", "Newsletter"];

export default function HelpCenterPage() {
  const [query, setQuery] = useState(""); // text typed in the search box
  const [category, setCategory] = useState("All"); // selected category chip
  const [openId, setOpenId] = useState(null); // which question is expanded (only one at a time)

  // Re-computed only when the search text or category changes
  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesCategory = category === "All" || faq.category === category;
      const matchesText = !text || faq.q.toLowerCase().includes(text) || faq.a.toLowerCase().includes(text);
      return matchesCategory && matchesText;
    });
  }, [query, category]);

  return (
    <StaticPageLayout
      pageTitle="Help Center"
      eyebrow="We're here to help"
      title="How can we help you?"
      subtitle="Search our answers, or browse by topic. Can't find what you need? Our team is one message away."
      widthClass="max-w-4xl"
    >
      {/* ===== Search + category chips + FAQ list ===== */}
      <section>
        {/* Search box */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon name="search" className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for answers, e.g. 'summary limit'"
            aria-label="Search help articles"
            className="w-full pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#104AC2] focus:border-transparent transition-all"
          />
        </div>

        {/* Category chips */}
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter help topics">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                category === cat
                  ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs sm:text-sm text-gray-500">
          {results.length} {results.length === 1 ? "answer" : "answers"} found
        </p>

        {/* FAQ accordion */}
        <div className="mt-3 space-y-3">
          {results.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors duration-300 ${
                  isOpen ? "border-[#104AC2]/50" : "border-gray-200 hover:border-[#104AC2]/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)} // click again to close
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold text-[#104AC2] uppercase tracking-wider mb-0.5">
                      {faq.category}
                    </span>
                    <span className="block font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                  </span>
                  <Icon
                    name="chevronDown"
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Smooth open / close using a grid row that animates between 0 and its full height */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Nothing matched the search */}
          {results.length === 0 && (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
              <span className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Icon name="search" className="w-7 h-7" />
              </span>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No answers found</h3>
              <p className="text-sm text-gray-500 px-4">Try different words, or pick another category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== Still need help? ===== */}
      <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white flex items-center justify-center shadow-lg flex-shrink-0">
            <Icon name="support" className="w-7 h-7" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Still need help?</h2>
            <p className="text-sm sm:text-base text-gray-600">Our support team usually replies within one business day.</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-xl hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-lg hover:shadow-xl font-semibold text-sm"
        >
          Contact support
          <Icon name="arrowRight" className="w-4 h-4" />
        </Link>
      </section>
    </StaticPageLayout>
  );
}
// src>components>LegalDocument.jsx  (NEW)
// Shared body for the Terms of Use and Privacy Policy pages:
// sticky table of contents (desktop), collapsible contents (mobile), highlighted active section.
"use client";

import { useEffect, useState } from "react";
import { Icon } from "./StaticPageLayout";

// sections = [{ id, title, paragraphs: [string], bullets: [string] }]
export default function LegalDocument({ updated, intro, sections, contactEmail }) {
  const [activeId, setActiveId] = useState(sections[0]?.id); // section currently on screen

  // Watches which section is near the top of the screen, so the table of contents can highlight it
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -75% 0px" } // a section counts as "active" when it crosses the upper part of the screen
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect(); // stop watching when leaving the page
  }, [sections]);

  // Smooth scroll to a section when a contents link is clicked
  const goTo = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  // The contents list (used twice: mobile + desktop)
  const tocLinks = (
    <ol className="space-y-1">
      {sections.map((s, index) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            onClick={(e) => goTo(e, s.id)}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeId === s.id
                ? "bg-gray-100 text-[#104AC2] font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="text-xs mt-0.5 opacity-70">{String(index + 1).padStart(2, "0")}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
      {/* Mobile / tablet: collapsible contents (native <details>, no JavaScript needed) */}
      <details className="lg:hidden bg-white border border-gray-200 rounded-2xl shadow-sm group">
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-semibold text-gray-800">
          Table of contents
          <Icon name="chevronDown" className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-2 pb-3">{tocLinks}</div>
      </details>

      {/* Desktop: sticky contents on the left */}
      <aside className="hidden lg:block sticky top-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
        <p className="px-3 pt-2 pb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">On this page</p>
        {tocLinks}
      </aside>

      {/* The document itself */}
      <article className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10">
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-5">
          <Icon name="clock" className="w-3.5 h-3.5" />
          Last updated: {updated}
        </p>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-10">{intro}</p>

        <div className="space-y-10">
          {sections.map((s, index) => (
            // scroll-mt keeps the heading visible below the top edge after a contents click
            <section key={s.id} id={s.id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white text-xs font-bold flex items-center justify-center">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{s.title}</h2>
              </div>

              <div className="space-y-3 sm:pl-11">
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed text-sm sm:text-base">{p}</p>
                ))}

                {s.bullets && (
                  <ul className="space-y-2">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 text-sm sm:text-base leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#104AC2] flex-shrink-0"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Questions box at the end */}
        <div className="mt-12 rounded-xl bg-gray-50 border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">Questions about this document?</p>
            <p className="text-sm text-gray-600">Write to us at {contactEmail}</p>
          </div>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-md font-semibold text-sm"
          >
            <Icon name="mail" className="w-4 h-4" />
            Email us
          </a>
        </div>
      </article>
    </div>
  );
}
// src>app>careers>page.jsx  (NEW)
"use client";

import { useState } from "react";
import StaticPageLayout, { Icon, SectionHeading } from "@/components/StaticPageLayout";

// Demo job list (replace with real roles, or load from a database later)
const JOBS = [
  { id: 1, title: "Senior Frontend Engineer", department: "Engineering", location: "Remote", type: "Full-time" },
  { id: 2, title: "Backend Engineer (Node.js)", department: "Engineering", location: "Dhaka, Bangladesh", type: "Full-time" },
  { id: 3, title: "AI / Prompt Engineer", department: "AI & Data", location: "Remote", type: "Full-time" },
  { id: 4, title: "Data Analyst", department: "AI & Data", location: "Dhaka, Bangladesh", type: "Part-time" },
  { id: 5, title: "Product Designer (UI/UX)", department: "Design", location: "Remote", type: "Full-time" },
  { id: 6, title: "News Editor", department: "Editorial", location: "London, UK", type: "Full-time" },
  { id: 7, title: "Community Manager", department: "Marketing", location: "Remote", type: "Contract" },
  { id: 8, title: "Growth Marketing Intern", department: "Marketing", location: "Dhaka, Bangladesh", type: "Internship" },
];

// Perks block
const PERKS = [
  { icon: "globe", title: "Remote-friendly", text: "Work from where you do your best thinking." },
  { icon: "clock", title: "Flexible hours", text: "We care about results, not when you log in." },
  { icon: "heart", title: "Health & wellness", text: "Health coverage and a monthly wellness stipend." },
  { icon: "sparkles", title: "Learning budget", text: "Yearly budget for courses, books and conferences." },
  { icon: "users", title: "Friendly team", text: "Small, kind and curious people who help each other." },
  { icon: "bolt", title: "Real impact", text: "Ship features that thousands of readers use daily." },
];

// Small colored dot per employment type (only uses colors that already work in dark mode)
const TYPE_STYLE = {
  "Full-time": "bg-green-100 text-green-700",
  "Part-time": "bg-yellow-100 text-yellow-700",
  Contract: "bg-purple-100 text-purple-700",
  Internship: "bg-gray-100 text-gray-600",
};

export default function CareersPage() {
  const [department, setDepartment] = useState("All"); // selected filter chip

  // Filter chips are built from the jobs themselves ("All" first)
  const departments = ["All", ...Array.from(new Set(JOBS.map((job) => job.department)))];

  const visibleJobs = department === "All" ? JOBS : JOBS.filter((job) => job.department === department);

  return (
    <StaticPageLayout
      pageTitle="Careers"
      eyebrow={`${JOBS.length} open positions`}
      title="Help us shape how the world reads the news"
      subtitle="We're a small, ambitious team building AI-powered news tools. Come do the best work of your career with us."
    >
      {/* ===== Perks ===== */}
      <section>
        <SectionHeading
          center
          eyebrow="Why NewsNexus"
          title="Perks that make a difference"
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#104AC2]/40 transition-all duration-300"
            >
              <span className="w-11 h-11 rounded-xl bg-blue-50 text-[#104AC2] flex items-center justify-center mb-4">
                <Icon name={perk.icon} className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-gray-900 mb-1">{perk.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{perk.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Open positions ===== */}
      <section>
        <SectionHeading
          eyebrow="Open positions"
          title="Find your role"
          subtitle="Filter by team to see what fits you best."
        />

        {/* Department filter chips (same look as the news category chips) */}
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter jobs by department">
          {departments.map((dep) => (
            <button
              key={dep}
              type="button"
              onClick={() => setDepartment(dep)}
              aria-pressed={department === dep} // screen readers know which chip is selected
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                department === dep
                  ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {dep}
            </button>
          ))}
        </div>

        {/* Job cards */}
        <div className="mt-6 space-y-3">
          {visibleJobs.map((job) => (
            <div
              key={job.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#104AC2]/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">{job.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="briefcase" className="w-4 h-4 text-gray-400" />
                    {job.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="pin" className="w-4 h-4 text-gray-400" />
                    {job.location}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLE[job.type]}`}>
                    {job.type}
                  </span>
                </div>
              </div>

              {/* Demo "Apply": opens the visitor's email app with a ready subject line */}
              <a
                href={`mailto:careers@newsnexus.example?subject=${encodeURIComponent("Application: " + job.title)}`}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-md hover:shadow-lg font-semibold text-sm"
              >
                Apply now
                <Icon name="arrowRight" className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Open application ===== */}
      <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6 sm:p-10 text-center">
        <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Icon name="mail" className="w-7 h-7" />
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Don&apos;t see your role?</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
          We&apos;re always happy to meet talented people. Send us your CV and tell us how you&apos;d like to help.
        </p>
        <a
          href="mailto:careers@newsnexus.example?subject=Open%20application"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#104AC2] text-[#104AC2] rounded-xl hover:bg-blue-50 transition-colors font-semibold text-sm"
        >
          careers@newsnexus.example
        </a>
      </section>
    </StaticPageLayout>
  );
}
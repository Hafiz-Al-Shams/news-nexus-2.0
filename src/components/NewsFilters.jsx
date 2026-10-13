// src>components>NewsFilters.jsx  (MODIFIED)
"use client";

// Compact filter controls (time range + category).
// The outer card and the "Filter News" heading now live in NewsFilterPanel, so this file only draws the controls.
export default function NewsFilters({
  currentTime,
  currentTopic,
  onTimeChange,
  onTopicChange,
}) {
  const times = [
    { value: "1h", label: "Last 1 Hour" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "3d", label: "Last 3 Days" },
    { value: "7d", label: "Last 7 Days" },
  ];

  const topics = [
    { value: "all", label: "All Topics" },
    { value: "politics", label: "Politics" },
    { value: "business", label: "Business" },
    { value: "technology", label: "Technology" },
    { value: "environment", label: "Environment" },
    { value: "sport", label: "Sport" },
    { value: "health", label: "Health" },
    { value: "science", label: "Science" },
    { value: "education", label: "Education" },
    { value: "books", label: "Books" },
    { value: "travel", label: "Travel" },
  ];

  // Shared look for the selected / unselected state (brand gradient stays the same as before)
  const activeClass = "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-sm";
  const idleClass = "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <div className="space-y-4">
      {/* Time Filter: 2x2 grid of small buttons */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Time Range
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {times.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onTimeChange(t.value)}
              aria-pressed={currentTime === t.value} // screen readers know which one is selected
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTime === t.value ? activeClass : idleClass
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Filter: wrapping pill chips (takes much less space than the old big grid) */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <button
              key={topic.value}
              type="button"
              onClick={() => onTopicChange(topic.value)}
              aria-pressed={currentTopic === topic.value}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentTopic === topic.value ? activeClass : idleClass
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
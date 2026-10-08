"use client";

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter News</h2>

      {/* Time Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Range
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {times.map((t) => (
            <button
              key={t.value}
              onClick={() => onTimeChange(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTime === t.value
                  ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {topics.map((topic) => (
            <button
              key={topic.value}
              onClick={() => onTopicChange(topic.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTopic === topic.value
                  ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
// src>components>TimeBar.jsx  (MODIFIED)
"use client";

import { useEffect, useState } from "react";

// Order = left to right on the bar. "zone" is the official IANA time zone name (handles daylight saving automatically)
const CLOCKS = [
  { label: "Bangladesh", zone: "Asia/Dhaka" },
  { label: "London", zone: "Europe/London" },
  { label: "New York", zone: "America/New_York" },
  { label: "Canada", zone: "America/Toronto" },
  { label: "Germany", zone: "Europe/Berlin" },
  { label: "Australia", zone: "Australia/Sydney" },
  { label: "Malaysia", zone: "Asia/Kuala_Lumpur" },
  { label: "Middle East", zone: "Asia/Riyadh" },
];

// Formats a date as hours:minutes (no seconds) for one time zone, e.g. "3:45 PM"
function formatTime(date, zone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone, // converts the real current moment to that country's local time
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// NEW: returns the GMT offset of a time zone right now, e.g. "GMT+6", "GMT-4", "GMT+1"
function getGmtOffset(date, zone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "shortOffset", // gives "GMT+6", "GMT-4", or just "GMT" when the offset is zero
  }).formatToParts(date);

  const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
  return offset === "GMT" ? "GMT+0" : offset; // show "GMT+0" instead of a bare "GMT" (London in winter)
}

export default function TimeBar() {
  const [now, setNow] = useState(null); // null until mounted, avoids server/client time mismatch

  useEffect(() => {
    setNow(new Date()); // first value right after the page loads

    // Check every second, but only re-render when the MINUTE changes (so the clock never lags more than 1 second)
    const intervalId = setInterval(() => {
      setNow((prev) => {
        const current = new Date();
        if (prev && Math.floor(prev.getTime() / 60000) === Math.floor(current.getTime() / 60000)) {
          return prev; // same minute, keep old state, no re-render
        }
        return current;
      });
    }, 1000);

    return () => clearInterval(intervalId); // stop the timer when leaving the page
  }, []);

  return (
    // sticky top-0 = stays at the top of the middle column while the news scrolls below it
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      {/* overflow-x-auto lets the bar scroll sideways on very narrow phones instead of squeezing the text */}
      <div className="flex overflow-x-auto">
        {CLOCKS.map((clock) => (
          <div
            key={clock.zone}
            className="flex-1 min-w-[76px] px-1 py-1 text-center leading-tight"
          >
            {/* Country name (tiny text) */}
            <p className="text-[10px] text-gray-500 whitespace-nowrap">{clock.label}</p>
            {/* Time for that country ("--:--" until the browser has loaded) */}
            <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">
              {now ? formatTime(now, clock.zone) : "--:--"}
            </p>
            {/* NEW: GMT offset below the time, e.g. "GMT+6" (updates itself when daylight saving changes) */}
            <p className="text-[10px] text-gray-700 whitespace-nowrap">
              {now ? getGmtOffset(now, clock.zone) : "GMT"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
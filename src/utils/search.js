// src/utils/search.js  (NEW)
// Shared by the browser AND the server, so both clean the keyword in exactly the same way.

export const MIN_SEARCH_LENGTH = 2;     // fewer letters than this = no search (saves API calls)
export const MAX_SEARCH_LENGTH = 80;    // longer text is cut off (stops abuse / huge cache keys)
export const SEARCH_DEBOUNCE_MS = 700;  // wait this long after the last keystroke before searching

// Turns whatever the user typed into one clean keyword:
// "  Climate    CHANGE  " -> "climate change"  (whitespace-only input becomes "")
export function normalizeKeyword(raw) {
  if (typeof raw !== "string") return "";

  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ") // remove hidden control characters
    .replace(/\s+/g, " ")                   // many spaces / tabs / new lines -> one space
    .trim()                                 // remove spaces at the start and end
    .toLowerCase()                          // same keyword in any case = same cache entry
    .slice(0, MAX_SEARCH_LENGTH)            // hard length limit
    .trim();
}
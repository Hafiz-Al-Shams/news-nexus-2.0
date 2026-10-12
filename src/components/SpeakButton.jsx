"use client";

import useSpeech from "@/hooks/useSpeech";

// Adds a full stop to text that has none, so the voice pauses between titles / bullets
const withPeriod = (t) => {
  const s = String(t || "").trim();
  return s && !/[.!?]$/.test(s) ? `${s}.` : s;
};

// Reusable "Listen / Stop" button. `text` can be a string or an array of strings (read one after another)
export default function SpeakButton({ text, label = "Listen", className = "" }) {
  const { isSupported, isSpeaking, speak, stop } = useSpeech();

  if (!isSupported) return null; // browser has no speech support, so the button is hidden

  const finalText = Array.isArray(text) ? text.map(withPeriod).join(" ") : text; // array -> one text

  const handleClick = () => {
    if (isSpeaking) stop(); // second click stops the voice
    else speak(finalText);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSpeaking ? "Stop listening" : label}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
        isSpeaking
          ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white border-transparent shadow-md" // active look while speaking
          : "bg-white text-[#104AC2] border-[#104AC2] hover:bg-blue-50"
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          {/* Stop icon */}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          Stop
        </>
      ) : (
        <>
          {/* Speaker icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
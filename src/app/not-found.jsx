// src>app>not-found.jsx  (MODIFIED)
import Link from "next/link";

// Shown automatically by Next.js for ANY URL that does not exist (typos, deleted pages like /chat-with-ai, etc.)
export default function NotFound() {
  return (
    // data-not-found is a marker: globals.css hides the floating "Chat with AI" button whenever it is on the page
    <div data-not-found className="min-h-screen bg-gray-50 relative flex items-center justify-center px-4 overflow-hidden">
      {/* Website Name - Top Left (same as the other pages, links home) */}
      <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 z-10">
        <h1 className="text-base lg:text-2xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </h1>
      </Link>

      {/* Soft brand-colored glow behind the content */}
      <div className="pointer-events-none absolute w-[420px] h-[420px] rounded-full bg-[#104AC2]/10 blur-3xl"></div>

      <main className="relative text-center max-w-md">
        {/* Big gradient 404 */}
        <p className="text-8xl sm:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] bg-clip-text text-transparent select-none">
          404
        </p>

        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">Page not found</h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600">
          The page you are looking for does not exist or may have been moved. Check the address for typos, or head back to the news.
        </p>

        {/* Back home button */}
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-xl hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Link>
      </main>
    </div>
  );
}
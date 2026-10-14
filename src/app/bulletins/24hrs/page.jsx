"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetch24hrsBulletin, expandBulletinDetails } from "@/store/slices/newsSlice";
import toast from "react-hot-toast";
import Link from "next/link";
import SpeakButton from "@/components/SpeakButton"; // text to speech button

// Small helper: 1 -> "01", 12 -> "12" (used for the number badges)
const pad = (n) => String(n).padStart(2, "0");

export default function Bulletin24HrsPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { data: session, status } = useSession(); // "status" tells us if the visitor is logged in
    const { bulletin } = useSelector((state) => state.news);
    const [showDetails, setShowDetails] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0); // NEW: stars light up while hovering
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        dispatch(fetch24hrsBulletin());
    }, [dispatch]);

    // Jump back to the top when switching between the short and the detailed view
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const handleShowDetails = async () => {
        if (bulletin.detailedCards.length > 0) {
            setShowDetails(true);
            scrollToTop();
            return;
        }

        try {
            await dispatch(expandBulletinDetails(bulletin.bullets)).unwrap();
            setShowDetails(true);
            scrollToTop();
            toast.success("Detailed news generated!");
        } catch (error) {
            toast.error(error.message || "Failed to generate details");
        }
    };

    const handleBackToBullets = () => {
        setShowDetails(false); // the detailed view (and its Listen button) unmounts, so the voice stops automatically
        scrollToTop();
    };

    const handleReviewSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setSubmittingReview(true);

        try {
            const response = await fetch("/api/reviews/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim(),
                    reviewType: 'bulletin_details'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit review");
            }

            toast.success("Thank you for your feedback!");
            setShowReview(false);
            setRating(0);
            setHoverRating(0);
            setComment("");
        } catch (err) {
            console.error("Review error:", err);
            toast.error(err.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    // Same timestamp text as before, built once so both views can show it
    const updatedText = bulletin.cachedAt
        ? `${new Date(bulletin.cachedAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        })}, ${new Date(bulletin.cachedAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
            timeZoneName: 'short'
        })}`
        : null;

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Website Name - Top Left (UNCHANGED) */}
            <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50">
                <h1 className="text-base lg:text-2xl font-bold">
                    <span className="text-gray-900">NEWS</span>
                    <span className="text-gray-500/95">NEXUS</span>
                </h1>
            </Link>

            {/* Page Title - Top Right (UNCHANGED) */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    24hrs News Bulletin
                </h2>
            </div>

            {/* Main Content (extra top padding keeps everything clear of the navbar) */}
            <main className="container mx-auto px-4 pt-24 pb-16 sm:pt-28">
                {/* ===== Loading State: spinner + soft skeleton cards ===== */}
                {bulletin.loading && (
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="inline-block w-14 h-14 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600 text-base sm:text-lg text-center px-4">
                                Generative AI is analyzing and prioritizing today's news...
                            </p>
                        </div>
                        <div className="space-y-3 opacity-60">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex gap-4 bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== Error State ===== */}
                {bulletin.error && !bulletin.loading && (
                    <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Bulletin</h3>
                        <p className="text-red-600 mb-5 text-sm sm:text-base">{bulletin.error}</p>
                        <button
                            onClick={() => dispatch(fetch24hrsBulletin())}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* ===== Bulletin Content ===== */}
                {!bulletin.loading && !bulletin.error && bulletin.bullets.length > 0 && (
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* ================= SHORT VIEW: 12 numbered bullets ================= */}
                        {!showDetails && (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {/* Hero card (brand gradient) */}
                                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] p-6 sm:p-10 text-white shadow-xl">
                                    {/* Soft decorative glows */}
                                    <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
                                    <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>

                                    <div className="relative flex flex-wrap items-end justify-between gap-6">
                                        <div className="min-w-0">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-4">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                AI Prioritized Top News Today
                                            </span>
                                            <h3 className="text-3xl sm:text-4xl font-bold mb-2">Quick Summary</h3>
                                            <p className="text-sm sm:text-base text-white/80 max-w-md">
                                                The 12 most important stories of the last 24 hours, at a glance.
                                            </p>
                                            {/* Timestamp (same data as before) */}
                                            {updatedText && (
                                                <p className="text-xs sm:text-sm text-white/70 italic mt-3">
                                                    Last Updated at {updatedText}
                                                </p>
                                            )}
                                        </div>

                                        {/* Reads all 12 bullets aloud, one after another */}
                                        <SpeakButton text={bulletin.bullets} label="Listen to Bulletin" className="shadow-lg" />
                                    </div>
                                </section>

                                {/* Numbered bullet cards */}
                                <ol className="space-y-3">
                                    {bulletin.bullets.map((bullet, index) => (
                                        <li
                                            key={index}
                                            className="group flex gap-4 items-start bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[#104AC2]/40 hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            {/* Number badge */}
                                            <span className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white text-sm font-bold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                                {pad(index + 1)}
                                            </span>
                                            <p className="text-gray-800 leading-relaxed text-base sm:text-[17px] font-medium pt-1 sm:pt-1.5">
                                                {bullet}
                                            </p>
                                        </li>
                                    ))}
                                </ol>

                                {/* Call to action: open the detailed view */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-center sm:text-left">
                                        <p className="font-semibold text-gray-900 text-base sm:text-lg">Want the full picture?</p>
                                        <p className="text-sm text-gray-600">Get a deeper AI breakdown of every story, with context and key facts.</p>
                                    </div>
                                    <button
                                        onClick={handleShowDetails}
                                        disabled={bulletin.loading}
                                        className="flex-shrink-0 px-6 sm:px-8 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-xl hover:from-[#153163] hover:to-[#0d3a9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base flex items-center gap-3"
                                    >
                                        {bulletin.loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Show More Details
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ================= DETAILED VIEW: story cards ================= */}
                        {showDetails && bulletin.detailedCards.length > 0 && (
                            <div className="space-y-6">
                                {/* Hero card with Back + Listen */}
                                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] p-6 sm:p-10 text-white shadow-xl">
                                    <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
                                    <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>

                                    <div className="relative">
                                        {/* Back button */}
                                        <button
                                            onClick={handleBackToBullets}
                                            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Back to Bulletins
                                        </button>

                                        <div className="flex flex-wrap items-end justify-between gap-6">
                                            <div className="min-w-0">
                                                <h3 className="text-3xl sm:text-4xl font-bold mb-2">Detailed Stories</h3>
                                                <p className="text-sm sm:text-base text-white/80 max-w-md">
                                                    Context, implications and key facts behind each of today's top stories.
                                                </p>
                                                {updatedText && (
                                                    <p className="text-xs sm:text-sm text-white/70 italic mt-3">
                                                        Last Updated at {updatedText}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Reads every card (title, then description) one after another */}
                                            <SpeakButton
                                                text={bulletin.detailedCards.flatMap((card) => [card.title, card.description])}
                                                label="Listen to Details"
                                                className="shadow-lg"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Cards grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {bulletin.detailedCards.map((card, index) => (
                                        <article
                                            key={index}
                                            className="group flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#104AC2]/40 transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Brand accent line */}
                                            <div className="bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] h-1.5"></div>
                                            <div className="flex flex-col flex-1 p-5 sm:p-6">
                                                {/* Story number chip */}
                                                <span className="self-start mb-4 inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                                                    Story {pad(index + 1)}
                                                </span>
                                                <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-snug">
                                                    {card.title}
                                                </h4>
                                                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                                                    {card.description}
                                                </p>
                                                {/* Summarized by AI tag (pushed to the card bottom so all cards line up) */}
                                                <div className="mt-auto pt-5 flex justify-end">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                        <svg className="w-3 h-3 text-[#104AC2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Summarized by AI
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ================= REVIEW SECTION (now at the bottom, after reading) ================= */}
                        <section className="max-w-3xl mx-auto">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                {!showReview ? (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                        <div className="flex items-center gap-4">
                                            <span className="hidden sm:flex w-12 h-12 rounded-xl bg-gray-100 items-center justify-center flex-shrink-0">
                                                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </span>
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-800">How was this feature?</h4>
                                                <p className="text-sm text-gray-600">Your feedback helps us improve</p>
                                            </div>
                                        </div>

                                        {/* Reviews are saved per user, so logged-out visitors are asked to log in first */}
                                        {status === "unauthenticated" ? (
                                            <Link
                                                href="/login"
                                                className="flex-shrink-0 px-6 py-2.5 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all font-semibold text-sm"
                                            >
                                                Login to Leave a Review
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => setShowReview(true)}
                                                className="flex-shrink-0 px-6 py-2.5 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all font-semibold text-sm"
                                            >
                                                Leave a Review
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <h4 className="text-lg font-semibold text-gray-800">Leave a Review</h4>

                                        {/* Star rating (still saves a 1-5 number, exactly like before) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rating (1-5)
                                            </label>
                                            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setRating(num)}
                                                        onMouseEnter={() => setHoverRating(num)}
                                                        aria-label={`${num} star${num > 1 ? "s" : ""}`}
                                                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                                                    >
                                                        <svg
                                                            className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${(hoverRating || rating) >= num ? "text-yellow-400" : "text-gray-300"}`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Comment (Optional)
                                            </label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Share your thoughts..."
                                                rows={3}
                                                maxLength={500}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#104AC2] resize-none text-sm sm:text-base"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {comment.length}/500 characters
                                            </p>
                                        </div>

                                        {/* Submit Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={handleReviewSubmit}
                                                disabled={submittingReview || rating === 0}
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#104AC2] to-[#1C3B7A] text-white rounded-xl hover:from-[#0d3da3] hover:to-[#152f61] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base"
                                            >
                                                {submittingReview ? "Submitting..." : "Submit Review"}
                                            </button>
                                            <button
                                                onClick={() => { setShowReview(false); setHoverRating(0); }}
                                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {/* ===== Empty State ===== */}
                {!bulletin.loading && !bulletin.error && bulletin.bullets.length === 0 && (
                    <div className="max-w-md mx-auto text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bulletin Available</h3>
                        <p className="text-gray-500 px-4">The bulletin is being generated. Please check back in a moment.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetch24hrsBulletin, expandBulletinDetails } from "@/store/slices/newsSlice";
import toast from "react-hot-toast";
import Link from "next/link";

export default function Bulletin24HrsPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { data: session } = useSession();
    const { bulletin } = useSelector((state) => state.news);
    const [showDetails, setShowDetails] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        dispatch(fetch24hrsBulletin());
    }, [dispatch]);

    const handleShowDetails = async () => {
        if (bulletin.detailedCards.length > 0) {
            setShowDetails(true);
            return;
        }

        try {
            await dispatch(expandBulletinDetails(bulletin.bullets)).unwrap();
            setShowDetails(true);
            toast.success("Detailed news generated!");
        } catch (error) {
            toast.error(error.message || "Failed to generate details");
        }
    };

    const handleBackToBullets = () => {
        setShowDetails(false);
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
            setComment("");
        } catch (err) {
            console.error("Review error:", err);
            toast.error(err.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Website Name - Top Left */}
            <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50">
                <h1 className="text-base lg:text-2xl font-bold">
                    <span className="text-gray-900">NEWS</span>
                    <span className="text-gray-500/95">NEXUS</span>
                </h1>
            </Link>

            {/* Page Title - Top Right */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    24hrs News Bulletin
                </h2>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-20 sm:py-24">
                {/* Loading State */}
                {bulletin.loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="inline-block w-16 h-16 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 text-base sm:text-lg text-center px-4">
                            Generative AI is analyzing and prioritizing today's news...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {bulletin.error && !bulletin.loading && (
                    <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Bulletin</h3>
                        <p className="text-red-600 mb-4">{bulletin.error}</p>
                        <button
                            onClick={() => dispatch(fetch24hrsBulletin())}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Bulletin Content */}
                {!bulletin.loading && !bulletin.error && bulletin.bullets.length > 0 && (
                    <div className="space-y-8">
                        {/* Review Section - At Top */}
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                {!showReview ? (
                                    <div className="text-center">
                                        <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">How was this feature?</h4>
                                        <p className="text-sm sm:text-base text-gray-600 mb-4">Your feedback helps us improve</p>
                                        <button
                                            onClick={() => setShowReview(true)}
                                            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all font-semibold text-sm sm:text-base"
                                        >
                                            Leave a Review
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Leave a Review</h4>

                                        {/* Rating */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rating (1-5)
                                            </label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setRating(num)}
                                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all text-sm sm:text-base ${rating >= num
                                                            ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white scale-110"
                                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                            }`}
                                                    >
                                                        {num}
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#104AC2] resize-none text-sm sm:text-base"
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
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#104AC2] to-[#1C3B7A] text-white rounded-lg hover:from-[#0d3da3] hover:to-[#152f61] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base"
                                            >
                                                {submittingReview ? "Submitting..." : "Submit Review"}
                                            </button>
                                            <button
                                                onClick={() => setShowReview(false)}
                                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bullet Points View */}
                        {!showDetails && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                    {/* Title */}
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                        Quick Summary
                                    </h3>

                                    {/* Subtitle */}
                                    <p className="text-sm sm:text-base text-gray-600 mb-2">
                                        AI Prioritized Top News Today
                                    </p>

                                    {/* Timestamp */}
                                    {bulletin.cachedAt && (
                                        <p className="text-xs sm:text-sm text-gray-700 italic mb-6">
                                            Last Updated at {new Date(bulletin.cachedAt).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                timeZone: 'UTC'
                                            })}, {new Date(bulletin.cachedAt).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'UTC',
                                                timeZoneName: 'short'
                                            })}
                                        </p>
                                    )}

                                    <div className="space-y-4">
                                        {bulletin.bullets.map((bullet, index) => (
                                            <div key={index} className="flex gap-4 items-start">
                                                {/* Black Bullet Point */}
                                                <div className="flex-shrink-0 mt-2">
                                                    <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                                                </div>
                                                <div className="flex-1 bg-[#1C3B7A]/5 hover:bg-[#1C3B7A]/15 transition-colors duration-200 p-1">
                                                    <p className="text-gray-800 leading-relaxed text-base sm:text-lg font-medium">
                                                        {bullet}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Show More Details Button - Right Aligned */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleShowDetails}
                                        disabled={bulletin.loading}
                                        className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base flex items-center gap-3"
                                    >
                                        {bulletin.loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                        {/* Detailed Cards View */}
                        {showDetails && bulletin.detailedCards.length > 0 && (
                            <div className="space-y-6">
                                <div className="max-w-6xl mx-auto">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Detailed Stories</h3>
                                        <button
                                            onClick={handleBackToBullets}
                                            className="px-4 py-2 text-[#104AC2] hover:text-[#1C3B7A] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Back to Bulletins
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {bulletin.detailedCards.map((card, index) => (
                                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] h-2"></div>
                                                <div className="p-5 sm:p-6">
                                                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-tight">
                                                        {card.title}
                                                    </h4>
                                                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-4">
                                                        {card.description}
                                                    </p>
                                                    {/* Summarized by AI Tag */}
                                                    <div className="flex justify-end">
                                                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                            Summarized by AI
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!bulletin.loading && !bulletin.error && bulletin.bullets.length === 0 && (
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bulletin Available</h3>
                        <p className="text-gray-500 mb-4 px-4">The bulletin is being generated. Please check back in a moment.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

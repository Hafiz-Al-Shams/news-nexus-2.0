// src>components>NewsSection.jsx  (MODIFIED)
"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link"; // used for the tablet "Subscribe Newsletter" link
import {
  fetchNewsAPIArticles,
  fetchGuardianArticles,
  loadMoreGuardianArticles, // loads the next 30 articles
  setActiveSource,
} from "@/store/slices/newsSlice";
import NewsCard from "./NewsCard";
import NewsFilterPanel from "./NewsFilterPanel"; // NEW: only used for the mobile / tablet filter block
import ReviewsAccordion from "./layout/ReviewsAccordion";
import useGuardianNews from "@/hooks/useGuardianNews"; // NEW: shared "load the news" action
import toast from "react-hot-toast";

// Turns a date into "just now", "5m ago", "3h ago" (shown as "News updated 3h ago")
function formatUpdated(dateString) {
  if (!dateString) return null;
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function NewsSection() {
  const dispatch = useDispatch();
  const {
    articles,
    guardianArticles,
    loading,
    guardianLoading,
    error,
    guardianError,
    filters,
    activeSource,
    guardianHasMore,         // true when "Load More News" has more to load
    guardianLoadingMore,     // true while "Load More News" is loading
    guardianLastFetched,
    guardianCachedAt,        // when the shown news was fetched from Guardian
  } = useSelector((state) => state.news);

  const { fetchGuardianNews } = useGuardianNews(); // used by the retry buttons below

  const [hasFetchedNewsAPI, setHasFetchedNewsAPI] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // only used by the mobile / tablet search box
  const [showMobileFilters, setShowMobileFilters] = useState(false); // mobile / tablet filter block open or closed

  // Load the default news (Last 24 Hours, All Topics) automatically the first time the homepage opens.
  // If the articles are already in Redux (user came back from another page), nothing is reloaded.
  useEffect(() => {
    if (guardianLastFetched) return;
    dispatch(fetchGuardianArticles(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once when the section appears

  // Fetch NewsAPI articles (kept for the retry button when NewsAPI is the active source)
  const fetchNewsAPINews = async () => {
    try {
      const result = await dispatch(fetchNewsAPIArticles(filters)).unwrap();
      setHasFetchedNewsAPI(true);
      dispatch(setActiveSource("newsapi"));

      if (result.articles && result.articles.length > 0) {
        toast.success(`Loaded ${result.articles.length} articles from NewsAPI`);
      } else {
        toast.error("No articles found from NewsAPI");
      }
    } catch (error) {
      console.error("NewsAPI fetch error:", error);
      setHasFetchedNewsAPI(true);

      if (error.message?.includes("Unauthorized")) {
        toast.error("Please login to view news");
      } else if (error.code === "RATE_LIMIT_EXCEEDED") {
        toast.error("NewsAPI rate limit exceeded. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to load NewsAPI articles");
      }
    }
  };

  // "Load More News" button, adds the next 30 articles below the current ones
  const handleLoadMore = async () => {
    try {
      await dispatch(loadMoreGuardianArticles()).unwrap();
    } catch (error) {
      if (error?.name === "ConditionError") return; // double click or nothing more to load, ignore
      console.error("Load more error:", error);

      if (error.code === "RATE_LIMIT_EXCEEDED") {
        toast.error("Guardian API rate limit exceeded. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to load more news");
      }
    }
  };

  const getCurrentArticles = () => {
    if (activeSource === "guardian") return guardianArticles;
    return articles;
  };

  const getCurrentLoading = () => {
    if (activeSource === "guardian") return guardianLoading;
    return loading;
  };

  const getCurrentError = () => {
    if (activeSource === "guardian") return guardianError;
    return error;
  };

  const currentArticles = getCurrentArticles();
  const currentLoading = getCurrentLoading();
  const currentError = getCurrentError();

  // "has the news been requested yet" comes from Redux (it survives leaving and returning to the page)
  const hasFetched = activeSource === "guardian"
    ? (!!guardianLastFetched || !!guardianError)
    : hasFetchedNewsAPI;

  // Also show the loading spinner for the very first moment, before the automatic load has started
  const showLoading = currentLoading || (activeSource === "guardian" && !hasFetched);

  // Retry action used by the error / empty states
  const retryAction = activeSource === "guardian" ? fetchGuardianNews : fetchNewsAPINews;

  return (
    <div className="space-y-6">
      {/* ===== Header: ONLY the title + subtitle, identical for logged-in and logged-out visitors ===== */}
      <header className="text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
          Latest News from Around the World
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          AI-powered Smart News Summaries for Busy Minds
        </p>
        {/* Small brand-colored accent line under the subtitle */}
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#1C3B7A] to-[#104AC2]"></div>
      </header>

      {/* ===== Mobile / tablet only: the right sidebar is hidden below "lg", so search + filters live here (collapsed by default) ===== */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setShowMobileFilters((open) => !open)}
          aria-expanded={showMobileFilters}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-800"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#104AC2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            Search &amp; Filter News
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showMobileFilters ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMobileFilters && (
          <div className="mt-3 space-y-3">
            {/* Search box (disabled, same "coming soon" feature as in the sidebar) */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled
                  className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-2">Search feature coming soon</p>
            </div>

            {/* The same filter card as in the desktop sidebar */}
            <NewsFilterPanel />
          </div>
        )}
      </div>

      {/* Loading State (also shown right when the homepage opens, while the default news loads) */}
      {showLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="inline-block w-12 md:w-16 h-12 md:h-16 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-base md:text-lg">Loading news from {activeSource === "guardian" ? "Guardian" : "NewsAPI"}...</p>
        </div>
      )}

      {/* Error State */}
      {currentError && !showLoading && hasFetched && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 text-center">
          <svg className="w-10 md:w-12 h-10 md:h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base md:text-lg font-semibold text-red-800 mb-2">Failed to Load News</h3>
          <p className="text-sm md:text-base text-red-600 mb-4">{currentError}</p>
          <button
            onClick={retryAction}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
          >
            Try Again
          </button>
        </div>
      )}

      {/* News Grid: the cards come directly after the title block */}
      {!showLoading && !currentError && currentArticles.length > 0 && hasFetched && (
        <>
          {/* Slim info row: article count + "News updated X ago" */}
          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm text-gray-600">
              Showing <span className="font-semibold">{currentArticles.length}</span> articles
            </p>
            {/* The news is cached for 12 hours, so this label replaces a refresh button */}
            {activeSource === "guardian" && guardianCachedAt && (
              <p className="text-xs md:text-sm text-gray-500">
                News updated {formatUpdated(guardianCachedAt)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {currentArticles.map((article, index) => (
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>

          {/* Load More News (adds 30 more, disabled when there is nothing more to load) */}
          {activeSource === "guardian" && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={!guardianHasMore || guardianLoadingMore}
                className="px-6 md:px-8 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold text-sm md:text-base flex items-center justify-center gap-3 min-w-[200px]"
              >
                {guardianLoadingMore ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading more...
                  </>
                ) : guardianHasMore ? (
                  "Load More News"
                ) : (
                  "No more news to load"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!showLoading && !currentError && currentArticles.length === 0 && hasFetched && (
        <div className="text-center py-20">
          <svg className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No News Found</h3>
          <p className="text-sm md:text-base text-gray-500 mb-4">Try adjusting your filters or check back later</p>
          <button
            onClick={retryAction}
            className="px-6 py-2 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-colors text-sm md:text-base"
          >
            Refresh News
          </button>
        </div>
      )}

      {/* Reviews Accordion - Hidden on Large Screens (reviews live in the right sidebar there) */}
      <ReviewsAccordion />

      {/* Tablet only: the newsletter link used to sit in the old header, so it stays reachable here
          (phones have it in the drawer, large screens have it in the right sidebar) */}
      <div className="hidden md:block lg:hidden text-center">
        <Link
          href="/newsletter"
          className="inline-block px-6 py-3 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
        >
          Subscribe to Our Newsletter
        </Link>
      </div>
    </div>
  );
}
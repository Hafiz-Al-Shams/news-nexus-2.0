"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link"; // used for the tablet "Subscribe Newsletter" link
import {
  fetchNewsAPIArticles,
  fetchGuardianArticles,
  loadMoreGuardianArticles, // NEW: loads the next 30 articles
  setActiveSource,
} from "@/store/slices/newsSlice";
import NewsFilters from "./NewsFilters";
import NewsCard from "./NewsCard";
import ReviewsAccordion from "./layout/ReviewsAccordion";
import toast from "react-hot-toast";

// NEW: turns a date into "just now", "5m ago", "3h ago" (shown as "News updated 3h ago")
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
  const router = useRouter();
  const dispatch = useDispatch();
  const { 
    articles, 
    guardianArticles,
    loading, 
    guardianLoading,
    error,
    guardianError,
    filters,
    appliedFilters,          // NEW: the filters the articles on screen were loaded with
    activeSource,
    guardianHasMore,         // NEW: true when "Load More News" has more to load
    guardianLoadingMore,     // NEW: true while "Load More News" is loading
    guardianLastFetched,
    guardianCachedAt,        // NEW: when the shown news was fetched from Guardian
  } = useSelector((state) => state.news);
  
  const [hasFetchedNewsAPI, setHasFetchedNewsAPI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // NEW: load the default news (Last 24 Hours, All Topics) automatically the first time the homepage opens.
  // Nobody has to click "Get The News" any more. The server answers from the 12-hour database cache.
  // If the articles are already in Redux (user came back from another page), nothing is reloaded.
  useEffect(() => {
    if (guardianLastFetched) return;
    dispatch(fetchGuardianArticles(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once when the section appears

  // Navigate to bulletin page
  const handleBulletinClick = () => {
    router.push('/bulletins/24hrs');
  };

  // Fetch NewsAPI articles
  const fetchNewsAPINews = async () => {
    try {
      const result = await dispatch(fetchNewsAPIArticles(filters)).unwrap();
      setHasFetchedNewsAPI(true);
      dispatch(setActiveSource('newsapi'));
      
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
      } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
        toast.error("NewsAPI rate limit exceeded. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to load NewsAPI articles");
      }
    }
  };

  // Fetch Guardian articles for the selected filters ("Get The News" button, Try Again, empty state button)
  const fetchGuardianNews = async () => {
    try {
      const result = await dispatch(fetchGuardianArticles(filters)).unwrap();
      dispatch(setActiveSource('guardian'));
      
      if (result.articles && result.articles.length > 0) {
        if (result.stale) {
          toast("Guardian is unavailable right now, showing saved news"); // expired cache used as a fallback
        } else {
          toast.success(`Loaded ${result.articles.length} articles from Guardian`);
        }
      } else {
        toast.error("No articles found from Guardian");
      }
    } catch (error) {
      if (error?.name === 'ConditionError') return; // a load was already running, ignore the extra click
      console.error("Guardian fetch error:", error);
      
      if (error.message?.includes("Unauthorized")) {
        toast.error("Please login to view news");
      } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
        toast.error("Guardian API rate limit exceeded. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to load Guardian articles");
      }
    }
  };

  // NEW: "Load More News" button, adds the next 30 articles below the current ones
  const handleLoadMore = async () => {
    try {
      await dispatch(loadMoreGuardianArticles()).unwrap();
    } catch (error) {
      if (error?.name === 'ConditionError') return; // double click or nothing more to load, ignore
      console.error("Load more error:", error);

      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        toast.error("Guardian API rate limit exceeded. Try again tomorrow.");
      } else {
        toast.error(error.message || "Failed to load more news");
      }
    }
  };

  const getCurrentArticles = () => {
    if (activeSource === 'guardian') return guardianArticles;
    return articles;
  };

  const getCurrentLoading = () => {
    if (activeSource === 'guardian') return guardianLoading;
    return loading;
  };

  const getCurrentError = () => {
    if (activeSource === 'guardian') return guardianError;
    return error;
  };

  const currentArticles = getCurrentArticles();
  const currentLoading = getCurrentLoading();
  const currentError = getCurrentError();

  // CHANGED: "has the news been requested yet" now comes from Redux (it survives leaving and returning to the page)
  const hasFetched = activeSource === 'guardian'
    ? (!!guardianLastFetched || !!guardianError)
    : hasFetchedNewsAPI;

  // NEW: also show the loading spinner for the very first moment, before the automatic load has started
  const showLoading = currentLoading || (activeSource === 'guardian' && !hasFetched);

  // NEW: "Get The News" is active only when a filter was changed compared to what is on screen
  const filtersChanged =
    filters.time !== appliedFilters.time || filters.topic !== appliedFilters.topic;
  const canGetNews = filtersChanged && !guardianLoading && !guardianLoadingMore;

  return (
    <div className="space-y-6">
      {/* Mobile: Brand Name */}
      <div className="md:hidden text-center pt-4">
        <h1 className="text-2xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </h1>
      </div>

      {/* Header - Responsive Layout */}
      <div className="lg:text-center md:flex md:items-center md:justify-between md:gap-4">
        {/* Medium/Tablet: Search Bar (Left) */}
        <div className="hidden md:block lg:hidden md:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled
              className="w-full px-4 py-2 pr-10 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title/Subtitle - All Screens */}
        <div className="flex-1 text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            Latest News from Around the World
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            AI-powered Smart News Summaries for Busy Minds
          </p>
        </div>

        {/* Medium/Tablet: Newsletter Button (Right) */}
        <div className="hidden md:block lg:hidden md:w-auto">
          <Link
            href="/newsletter"
            className="inline-block px-4 py-2 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Subscribe Newsletter
          </Link>
        </div>
      </div>

      {/* Mobile: Search Bar (Below Title) */}
      <div className="md:hidden">
        <div className="relative">
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled
            className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-xs text-gray-500 mt-2">Search feature coming soon</p>
      </div>

      {/* Filters */}
      <NewsFilters
        currentTime={filters.time}
        currentTopic={filters.topic}
        onTimeChange={(time) => dispatch({ type: 'news/setTimeFilter', payload: time })}
        onTopicChange={(topic) => dispatch({ type: 'news/setTopicFilter', payload: topic })}
      />

      {/* Get The News Button: disabled until a filter is changed */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={fetchGuardianNews}
          disabled={!canGetNews} // CHANGED: enabled only after a filter changed (and nothing is loading)
          className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-base md:text-lg flex items-center justify-center gap-3 min-w-[200px] md:min-w-[240px]"
        >
          {guardianLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-5 md:w-6 h-5 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Get The News
            </>
          )}
        </button>

        {/* NEW: small hint while the button is disabled */}
        {!filtersChanged && !guardianLoading && (
          <p className="text-xs text-gray-500">Change the time range or category above to load different news</p>
        )}
      </div>

      {/* Active Source Indicator */}
      {hasFetched && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs md:text-sm">
            <span className="text-gray-600">Showing news from:</span>
            <span className={`font-semibold ${activeSource === 'guardian' ? 'text-[#104AC2]' : 'text-[#1C3B7A]'}`}>
              {activeSource === 'guardian' ? 'The Guardian' : 'NewsAPI'}
            </span>
          </div>
        </div>
      )}

      {/* Loading State (also shown right when the homepage opens, while the default news loads) */}
      {showLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="inline-block w-12 md:w-16 h-12 md:h-16 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-base md:text-lg">Loading news from {activeSource === 'guardian' ? 'Guardian' : 'NewsAPI'}...</p>
        </div>
      )}

      {/* Error State */}
      {currentError && !showLoading && hasFetched && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 text-center">
          <svg className="w-10 md:w-12 h-10 md:h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base md:text-lg font-semibold text-red-800 mb-2">Failed to Load News</h3>
          <p className="text-sm md:text-base text-red-600 mb-4">{currentError}</p>
          <button
            onClick={activeSource === 'guardian' ? fetchGuardianNews : fetchNewsAPINews}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
          >
            Try Again
          </button>
        </div>
      )}

      {/* News Grid */}
      {!showLoading && !currentError && currentArticles.length > 0 && hasFetched && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs md:text-sm text-gray-600">
              Showing <span className="font-semibold">{currentArticles.length}</span> articles
            </p>
            {/* CHANGED: the old "Refresh" button is replaced by this label (the news is cached for 12 hours, so refreshing would return the same data) */}
            {activeSource === 'guardian' && guardianCachedAt && (
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

          {/* NEW: Load More News (adds 30 more, disabled when there is nothing more to load) */}
          {activeSource === 'guardian' && (
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
            onClick={activeSource === 'guardian' ? fetchGuardianNews : fetchNewsAPINews}
            className="px-6 py-2 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-colors text-sm md:text-base"
          >
            Refresh News
          </button>
        </div>
      )}

      {/* Reviews Accordion - Hidden on Large Screens */}
      <ReviewsAccordion />
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast"; // NEW: confirmation messages for review actions

// How often the admin page refreshes the users data (this is what makes it "real-time")
const POLL_INTERVAL_MS = 10 * 1000; // 10 seconds

// NEW: how often the review list refreshes (also keeps the "pending" badge up to date)
const REVIEWS_POLL_MS = 30 * 1000; // 30 seconds

// Turns a date into "Just now", "5m ago", "3h ago", or a full date
function formatLastSeen(dateString) {
  if (!dateString) return "Never";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateString).toLocaleDateString();
}

// Turns Kit's subscriber state into a readable label and badge color
function subscriberStatus(state) {
  switch (state) {
    case "active":
      return { label: "Subscribed", className: "bg-green-100 text-green-700" };
    case "inactive":
      return { label: "Pending confirmation", className: "bg-yellow-100 text-yellow-700" }; // has not clicked the confirm link yet
    case "cancelled":
      return { label: "Unsubscribed", className: "bg-gray-100 text-gray-600" };
    case "bounced":
      return { label: "Bounced", className: "bg-red-100 text-red-700" };
    case "complained":
      return { label: "Complained", className: "bg-red-100 text-red-700" };
    default:
      return { label: state || "Unknown", className: "bg-gray-100 text-gray-600" };
  }
}

// NEW: badge for a review's approval status
function reviewStatusBadge(status) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-700" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-700" };
    default:
      return { label: "Pending approval", className: "bg-yellow-100 text-yellow-700" };
  }
}

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false); // true when the logged-in user is not an admin
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("online"); // users tab: "online" or "all"
  const [lastUpdated, setLastUpdated] = useState(null);

  // Which main section is open: "users", "subscribers" or "reviews"
  const [section, setSection] = useState("users");

  // Newsletter subscribers state (loaded from Kit through /api/admin/subscribers)
  const [subscribers, setSubscribers] = useState([]);
  const [subsCounts, setSubsCounts] = useState({ active: 0, pending: 0, unsubscribed: 0, total: 0 });
  const [subsTruncated, setSubsTruncated] = useState(false); // true when there are more subscribers than were loaded
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsLoaded, setSubsLoaded] = useState(false); // so the tab loads data only the first time it opens
  const [subsError, setSubsError] = useState(null);
  const [subsFilter, setSubsFilter] = useState("active"); // "active" or "all"
  const [subsUpdated, setSubsUpdated] = useState(null);

  // ===== NEW: USER REVIEWS state (site reviews that wait for approval) =====
  const [reviews, setReviews] = useState([]);                              // reviews of the selected tab
  const [reviewCounts, setReviewCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [reviewsFilter, setReviewsFilter] = useState("pending");           // "pending" | "approved" | "rejected"
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsUpdated, setReviewsUpdated] = useState(null);
  const [actionId, setActionId] = useState(null);                          // review that is being updated right now

  // Fetch users from the admin API
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });

      // 403 = logged in but not an admin
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load users");

      setUsers(data.users);
      setTotalUsers(data.totalUsers);
      setOnlineCount(data.onlineCount);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch newsletter subscribers from the admin API (which reads them from Kit)
  const fetchSubscribers = useCallback(async () => {
    setSubsLoading(true);
    try {
      const response = await fetch("/api/admin/subscribers", { cache: "no-store" });

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load subscribers");

      setSubscribers(data.subscribers);
      setSubsCounts(data.counts);
      setSubsTruncated(!!data.truncated);
      setSubsUpdated(new Date());
      setSubsError(null);
      setSubsLoaded(true);
    } catch (err) {
      console.error("Admin subscribers fetch error:", err);
      setSubsError(err.message);
      setSubsLoaded(true); // stop auto-retrying, the admin can press Refresh
    } finally {
      setSubsLoading(false);
    }
  }, []);

  // NEW: fetch the reviews of the selected tab (+ the counts of all tabs) from the admin API
  const fetchAdminReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews?status=${reviewsFilter}`, { cache: "no-store" });

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load reviews");

      setReviews(data.reviews);
      setReviewCounts(data.counts);
      setReviewsUpdated(new Date());
      setReviewsError(null);
    } catch (err) {
      console.error("Admin reviews fetch error:", err);
      setReviewsError(err.message);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewsFilter]);

  // NEW: approve / reject / move back to pending
  const handleReviewAction = async (id, action) => {
    setActionId(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update review");

      toast.success(
        action === "approve" ? "Review approved, it is now public" : action === "reject" ? "Review rejected" : "Moved back to pending"
      );
      await fetchAdminReviews(); // reload the list and the counts
    } catch (err) {
      console.error("Review action error:", err);
      toast.error(err.message || "Failed to update review");
    } finally {
      setActionId(null);
    }
  };

  // NEW: delete a review forever (asks first)
  const handleReviewDelete = async (id) => {
    if (!window.confirm("Delete this review permanently?")) return;

    setActionId(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete review");

      toast.success("Review deleted");
      await fetchAdminReviews();
    } catch (err) {
      console.error("Review delete error:", err);
      toast.error(err.message || "Failed to delete review");
    } finally {
      setActionId(null);
    }
  };

  // Send logged-out visitors to the login page
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load users now, then keep refreshing every 10 seconds (stops if access is denied)
  useEffect(() => {
    if (status !== "authenticated" || accessDenied) return;

    fetchUsers();
    const intervalId = setInterval(fetchUsers, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId); // stop polling when leaving the page
  }, [status, accessDenied, fetchUsers]);

  // Load subscribers the first time the "Newsletter Subscribers" section is opened (no auto-polling, protects the Kit rate limit)
  useEffect(() => {
    if (section !== "subscribers" || status !== "authenticated" || accessDenied || subsLoaded) return;
    fetchSubscribers();
  }, [section, status, accessDenied, subsLoaded, fetchSubscribers]);

  // NEW: load reviews right away (so the "pending" badge on the tab is correct), reload when the tab changes,
  // and refresh every 30 seconds so new reviews appear without pressing anything
  useEffect(() => {
    if (status !== "authenticated" || accessDenied) return;

    fetchAdminReviews();
    const intervalId = setInterval(fetchAdminReviews, REVIEWS_POLL_MS);

    return () => clearInterval(intervalId);
  }, [status, accessDenied, fetchAdminReviews]);

  // Rows shown in the users table depend on the selected tab
  const onlineUsers = users.filter((u) => u.isOnline);
  const visibleUsers = activeTab === "online" ? onlineUsers : users;

  // Rows shown in the subscribers table depend on the selected filter
  const visibleSubscribers = subsFilter === "active" ? subscribers.filter((s) => s.state === "active") : subscribers;

  // Shared look of the 3 main section buttons
  const sectionButtonClass = (name) =>
    `px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
      section === name
        ? "bg-gray-900 text-white shadow-md"
        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
    }`;

  // ---------- Loading screen ----------
  if (status === "loading" || (status === "authenticated" && loading && !accessDenied)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- Access denied screen (non-admin users) ----------
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">This page is only available to administrators.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all font-semibold text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Admin dashboard ----------
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
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Admin Dashboard</h2>
      </div>

      <main className="container mx-auto px-4 py-20 sm:py-24 max-w-6xl">
        {/* Main section switch (Users / Newsletter Subscribers / User Reviews) */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          <button onClick={() => setSection("users")} className={sectionButtonClass("users")}>
            Users
          </button>
          <button onClick={() => setSection("subscribers")} className={sectionButtonClass("subscribers")}>
            Newsletter Subscribers
          </button>
          {/* NEW: reviews section, with a red counter when reviews are waiting for approval */}
          <button onClick={() => setSection("reviews")} className={`${sectionButtonClass("reviews")} inline-flex items-center gap-2`}>
            User Reviews
            {reviewCounts.pending > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                {reviewCounts.pending}
              </span>
            )}
          </button>
        </div>

        {/* ================= USERS SECTION (unchanged) ================= */}
        {section === "users" && (
          <>
            {/* Live indicator */}
            <div className="flex items-center justify-end gap-2 mb-4 text-xs sm:text-sm text-gray-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span>
                Live
                {lastUpdated && ` • updated ${lastUpdated.toLocaleTimeString()}`}
              </span>
            </div>

            {/* Error banner (shown if a refresh fails, old data stays visible) */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Online Now</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-600">{onlineCount}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("online")}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "online"
                    ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                Online Now ({onlineCount})
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                All Users ({totalUsers})
              </button>
            </div>

            {/* Users table (scrolls sideways on small screens) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              {visibleUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  {activeTab === "online" ? "No users are online right now." : "No users found."}
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 font-semibold">#</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Name</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Email</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Role</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleUsers.map((u, index) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar with the first letter of the name */}
                            <div className="w-8 h-8 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <span className="font-medium text-gray-800 whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-gray-500">
                              <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                              {formatLastSeen(u.lastSeenAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ================= NEWSLETTER SUBSCRIBERS SECTION (unchanged) ================= */}
        {section === "subscribers" && (
          <>
            {/* Refresh bar (subscribers are loaded from Kit on demand, not every 10 seconds) */}
            <div className="flex items-center justify-end gap-3 mb-4 text-xs sm:text-sm text-gray-500">
              {subsUpdated && <span>Updated {subsUpdated.toLocaleTimeString()}</span>}
              <button
                onClick={fetchSubscribers}
                disabled={subsLoading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {subsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Error banner */}
            {subsError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {subsError}
              </div>
            )}

            {/* Warning when Kit has more subscribers than the page loads */}
            {subsTruncated && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Showing the newest 5000 subscribers only. Open Kit to see the full list.
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Subscribed</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-600">{subsCounts.active}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Pending Confirmation</p>
                <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{subsCounts.pending}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Unsubscribed</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-600">{subsCounts.unsubscribed}</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSubsFilter("active")}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  subsFilter === "active"
                    ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                Subscribed ({subsCounts.active})
              </button>
              <button
                onClick={() => setSubsFilter("all")}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  subsFilter === "all"
                    ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                All ({subsCounts.total})
              </button>
            </div>

            {/* Subscribers table (scrolls sideways on small screens) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              {subsLoading && subscribers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">Loading subscribers from Kit...</div>
              ) : visibleSubscribers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  {subsFilter === "active" ? "No active subscribers yet." : "No subscribers found."}
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 font-semibold">#</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Email</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Name</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Status</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Subscribed On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleSubscribers.map((s, index) => {
                      const badge = subscriberStatus(s.state);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 text-gray-500">{index + 1}</td>
                          <td className="px-4 sm:px-6 py-3 font-medium text-gray-800">{s.email}</td>
                          <td className="px-4 sm:px-6 py-3 text-gray-600">{s.name || "-"}</td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-gray-600 whitespace-nowrap">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ================= USER REVIEWS SECTION (NEW) ================= */}
        {section === "reviews" && (
          <>
            {/* Refresh bar */}
            <div className="flex items-center justify-end gap-3 mb-4 text-xs sm:text-sm text-gray-500">
              {reviewsUpdated && <span>Updated {reviewsUpdated.toLocaleTimeString()}</span>}
              <button
                onClick={fetchAdminReviews}
                disabled={reviewsLoading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {reviewsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Error banner */}
            {reviewsError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {reviewsError}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Waiting for approval</p>
                <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{reviewCounts.pending}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Approved (public)</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-600">{reviewCounts.approved}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Rejected</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-600">{reviewCounts.rejected}</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: "pending", label: `Pending (${reviewCounts.pending})` },
                { key: "approved", label: `Approved (${reviewCounts.approved})` },
                { key: "rejected", label: `Rejected (${reviewCounts.rejected})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setReviewsFilter(tab.key)}
                  className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    reviewsFilter === tab.key
                      ? "bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Review cards */}
            <div className="space-y-3">
              {reviewsLoading && reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 text-gray-500">
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 text-gray-500">
                  {reviewsFilter === "pending" ? "No reviews are waiting for approval." : `No ${reviewsFilter} reviews.`}
                </div>
              ) : (
                reviews.map((r) => {
                  const badge = reviewStatusBadge(r.status);
                  const busy = actionId === r.id; // buttons of this card are disabled while its request runs
                  return (
                    <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(r.userName || r.userEmail)?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-800 text-sm">{r.userName || "Reader"}</p>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 break-all">{r.userEmail}</p>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < r.rating ? "text-yellow-400" : "text-gray-300"}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d={STAR_PATH} />
                                </svg>
                              ))}
                            </div>

                            <p className="text-sm text-gray-700 mt-2 break-words whitespace-pre-wrap">{r.comment}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Submitted {new Date(r.createdAt).toLocaleString()}
                              {r.reviewedAt && ` • reviewed ${new Date(r.reviewedAt).toLocaleString()}`}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons depend on the current status */}
                        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch flex-shrink-0">
                          {r.status !== "approved" && (
                            <button
                              onClick={() => handleReviewAction(r.id, "approve")}
                              disabled={busy}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button
                              onClick={() => handleReviewAction(r.id, "reject")}
                              disabled={busy}
                              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {r.status === "approved" ? "Remove from site" : "Reject"}
                            </button>
                          )}
                          {r.status === "rejected" && (
                            <button
                              onClick={() => handleReviewDelete(r.id)}
                              disabled={busy}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
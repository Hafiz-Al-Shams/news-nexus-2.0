"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// How often the admin page refreshes the users data (this is what makes it "real-time")
const POLL_INTERVAL_MS = 10 * 1000; // 10 seconds

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

// NEW: turns Kit's subscriber state into a readable label and badge color
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

  // NEW: which main section is open: "users" or "subscribers"
  const [section, setSection] = useState("users");

  // NEW: newsletter subscribers state (loaded from Kit through /api/admin/subscribers)
  const [subscribers, setSubscribers] = useState([]);
  const [subsCounts, setSubsCounts] = useState({ active: 0, pending: 0, unsubscribed: 0, total: 0 });
  const [subsTruncated, setSubsTruncated] = useState(false); // true when there are more subscribers than were loaded
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsLoaded, setSubsLoaded] = useState(false); // so the tab loads data only the first time it opens
  const [subsError, setSubsError] = useState(null);
  const [subsFilter, setSubsFilter] = useState("active"); // "active" or "all"
  const [subsUpdated, setSubsUpdated] = useState(null);

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

  // NEW: fetch newsletter subscribers from the admin API (which reads them from Kit)
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

  // NEW: load subscribers the first time the "Newsletter Subscribers" section is opened (no auto-polling, protects the Kit rate limit)
  useEffect(() => {
    if (section !== "subscribers" || status !== "authenticated" || accessDenied || subsLoaded) return;
    fetchSubscribers();
  }, [section, status, accessDenied, subsLoaded, fetchSubscribers]);

  // Rows shown in the users table depend on the selected tab
  const onlineUsers = users.filter((u) => u.isOnline);
  const visibleUsers = activeTab === "online" ? onlineUsers : users;

  // NEW: rows shown in the subscribers table depend on the selected filter
  const visibleSubscribers = subsFilter === "active" ? subscribers.filter((s) => s.state === "active") : subscribers;

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
        {/* NEW: main section switch (Users / Newsletter Subscribers) */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
          <button
            onClick={() => setSection("users")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              section === "users"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setSection("subscribers")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              section === "subscribers"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Newsletter Subscribers
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

        {/* ================= NEWSLETTER SUBSCRIBERS SECTION (NEW) ================= */}
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
      </main>
    </div>
  );
}
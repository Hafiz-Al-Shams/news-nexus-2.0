"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// How often the admin page refreshes the data (this is what makes it "real-time")
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

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false); // true when the logged-in user is not an admin
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("online"); // "online" or "all"
  const [lastUpdated, setLastUpdated] = useState(null);

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

  // Send logged-out visitors to the login page
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load data now, then keep refreshing every 10 seconds (stops if access is denied)
  useEffect(() => {
    if (status !== "authenticated" || accessDenied) return;

    fetchUsers();
    const intervalId = setInterval(fetchUsers, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId); // stop polling when leaving the page
  }, [status, accessDenied, fetchUsers]);

  // Rows shown in the table depend on the selected tab
  const onlineUsers = users.filter((u) => u.isOnline);
  const visibleUsers = activeTab === "online" ? onlineUsers : users;

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
      </main>
    </div>
  );
}
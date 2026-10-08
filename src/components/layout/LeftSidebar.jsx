"use client";

import { useSession, signOut } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { logout as reduxLogout } from "@/store/slices/userSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LeftSidebar({ isDrawerMode = false, onLinkClick }) {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      dispatch(reduxLogout());
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
      if (onLinkClick) onLinkClick();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setIsLoggingOut(false);
    }
  };

  const handleBulletinClick = () => {
    if (!isAuthenticated) {
      toast.error("Please login to view bulletins");
      router.push("/login");
    } else {
      router.push("/bulletins/24hrs");
    }
    if (onLinkClick) onLinkClick();
  };

  const handleAssistantClick = () => {
    if (onLinkClick) onLinkClick();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand Name - Sticky */}
      <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </h1>
      </div>

      {/* Bulletin Button */}
      <div className="px-4 py-4">
        <button
          onClick={handleBulletinClick}
          className="w-full px-5 py-2.5 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-md hover:shadow-lg font-medium text-sm flex items-center justify-start gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="flex flex-col items-start leading-tight">
            AI Powered Current
            <span>News Bulletin</span>
          </span>
        </button>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* NewsNexus Assistant */}
      <div className="px-4 py-4">
        <Link
          href="/chat-with-ai"
          onClick={handleAssistantClick}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center gap-3 text-gray-700"
        >
          <svg className="w-5 h-5 text-[#104AC2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          NewsNexus Assistant
        </Link>
      </div>

      {/* Drawer Mode: Subscribe Newsletter Button */}
      {isDrawerMode ? (
        <>
          <div className="border-t border-gray-200"></div>
          <div className="px-4 py-4">
            <button className="w-full px-6 py-3 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors font-semibold text-sm shadow-md hover:shadow-lg">
              Subscribe to Our Newsletter
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Get daily news updates
            </p>
          </div>
          <div className="border-t border-gray-200"></div>
        </>
      ) : (
        /* Desktop/Tablet Mode: Sign In Button or Profile Section */
        <>
          {isAuthenticated && user ? (
            <>
              <div className="border-t border-gray-200"></div>
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile</p>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-200"></div>
            </>
          ) : (
            <>
              <div className="px-4 py-4">
                <Link
                  href="/login"
                  className="block w-full px-4 py-3 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors text-center text-sm font-semibold"
                >
                  Sign In
                </Link>
              </div>
              <div className="border-t border-gray-200"></div>
            </>
          )}
        </>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4">
        <div className="space-y-2 mb-4">
          <button className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm cursor-pointer">
            About Us
          </button>
          <button className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm cursor-pointer">
            Careers
          </button>
          <button className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm cursor-pointer">
            Help Center
          </button>
          <button className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm cursor-pointer">
            Contact
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <button className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm cursor-pointer">
            Terms of Use
          </button>
          <button className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm cursor-pointer">
            Privacy Policy
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-4">
        <p className="text-xs text-gray-500 text-center">
          ©2025 NewsNexus. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
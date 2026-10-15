// src>components>layout>UserModal.jsx  (MODIFIED)
"use client";

import { signOut, useSession } from "next-auth/react"; // also reads the session directly
import { useDispatch } from "react-redux";
import { logout as reduxLogout } from "@/store/slices/userSlice";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function UserModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const user = session?.user || null; // no more waiting for Redux
  const isAuthenticated = !!user;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      dispatch(reduxLogout());
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {isAuthenticated ? (
          <>
            {/* User Info */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {user.name || "User"}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {/* Logout Button
                CHANGED: same neutral gray as the desktop sidebar logout (was red), so both places match */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full px-4 py-3 bg-[#666666] text-white rounded-lg hover:bg-[#555555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </>
        ) : (
          <>
            {/* Not Logged In */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-2xl mx-auto mb-4">
                ?
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Not Logged In
              </h3>
              <p className="text-sm text-gray-500">
                Sign in to access all features
              </p>
            </div>

            {/* Sign In Button */}
            <Link
              href="/login"
              onClick={onClose}
              className="block w-full px-4 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-colors text-center text-sm font-semibold"
            >
              Sign In
            </Link>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
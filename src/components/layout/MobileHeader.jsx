"use client";

import { VscMenu } from "react-icons/vsc";
import { useSelector } from "react-redux";

export default function MobileHeader({ onMenuClick, onUserClick }) {
  const { user, isAuthenticated } = useSelector((state) => state.user);

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <VscMenu className="w-6 h-6 text-gray-700" />
        </button>

        {/* Brand */}
        <h1 className="text-xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </h1>

        {/* User Circle */}
        <button
          onClick={onUserClick}
          className="w-8 h-8 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity"
          aria-label="User menu"
        >
          {isAuthenticated && user
            ? (user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U")
            : "?"}
        </button>
      </div>
    </header>
  );
}
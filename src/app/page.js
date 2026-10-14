// src>app>page.js  (MODIFIED)
"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, logout as reduxLogout } from "@/store/slices/userSlice";
import { openChat } from "@/store/slices/uiSlice"; // NEW: opens the chat modal
import toast from "react-hot-toast";
import NewsSection from "@/components/NewsSection";
import MainLayout from "@/components/layout/MainLayout";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import MainContent from "@/components/layout/MainContent";
import MobileHeader from "@/components/layout/MobileHeader";
import LeftDrawer from "@/components/layout/LeftDrawer";
import UserModal from "@/components/layout/UserModal";

export default function Home() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const chatOpen = useSelector((state) => state.ui.chatOpen); // NEW: hide the floating button while the modal is open

  // Mobile drawer and modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Sync NextAuth session with Redux store
  useEffect(() => {
    if (session?.user) {
      dispatch(setUser(session.user)); // logged in: save user in Redux
    } else if (status !== "loading") {
      dispatch(reduxLogout()); // logged out: clear Redux user
    }
  }, [session, status, dispatch]);

  // Handlers
  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleUserClick = () => {
    setIsUserModalOpen(true);
  };

  const handleUserModalClose = () => {
    setIsUserModalOpen(false);
  };

  return (
    // Plain <div> wrapper (not a fragment) so Next.js scroll check doesn't hit the sticky MobileHeader
    <div>
      {/* Mobile Header - Only visible on small screens */}
      <MobileHeader
        onMenuClick={handleMenuClick}
        onUserClick={handleUserClick}
      />

      {/* Mobile Drawer - Only visible on small screens when open */}
      <LeftDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose}>
        <LeftSidebar isDrawerMode={true} onLinkClick={handleDrawerClose} />
      </LeftDrawer>

      {/* User Modal - Only visible on small screens when open */}
      <UserModal isOpen={isUserModalOpen} onClose={handleUserModalClose} />

      {/* 3-Column Layout - Hidden mobile header area */}
      <MainLayout
        leftSidebar={<LeftSidebar />}
        mainContent={
          <MainContent>
            <NewsSection />
          </MainContent>
        }
        rightSidebar={<RightSidebar />}
      />

      {/* Floating AI Chat Button (position unchanged). It now OPENS THE MODAL instead of going to another page,
          and it hides while the modal is open (the modal appears exactly where the button was) */}
      {!chatOpen && (
        <button
          type="button"
          onClick={() => dispatch(openChat())} // opens the chat modal
          className="fixed bottom-6 md:bottom-10 lg:bottom-24 right-4 md:right-6 z-50 group"
          aria-label="Chat with AI"
        >
          <div className="relative">
            {/* Pulse animation ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></div>

            {/* Main button */}
            <div className="relative bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white p-3 md:p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 active:scale-95">
              {/* Chat icon */}
              <svg
                className="w-6 md:w-7 h-6 md:h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>

              {/* Notification dot */}
              <span className="absolute -top-1 -right-1 w-3 md:w-4 h-3 md:h-4 bg-red-500 rounded-full border-2 border-white"></span>
            </div>

            {/* Tooltip */}
            <div className="hidden md:block absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm py-2 px-4 rounded-lg whitespace-nowrap shadow-lg">
                Chat with AI
                <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, logout as reduxLogout } from "@/store/slices/userSlice";
import toast from "react-hot-toast";
import Link from "next/link";
import NewsSection from "@/components/NewsSection";
import Swal from "sweetalert2";
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

  // Mobile drawer and modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Show development alert on first load
  useEffect(() => {
    Swal.fire({
      title: "Still Under Raw Development",
      text: "This website is currently under development. Some features may not work as expected.",
      icon: "info",
      confirmButtonText: "View Anyway",
      confirmButtonColor: "#104AC2",
      allowOutsideClick: false,
    });
  }, []);

  // Sync NextAuth session with Redux store
  useEffect(() => {
    if (session?.user) {
      dispatch(setUser(session.user));
    } else if (status !== "loading") {
      dispatch(reduxLogout());
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

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-[#104AC2] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
            {isAuthenticated && user ? (
              // Logged In - Show News
              <NewsSection />
            ) : (
              // Not Logged In - Landing Page
              <div className="flex items-center justify-center min-h-[80vh] px-4">
                <div className="text-center max-w-2xl w-full">
                  {/* Hero Icon */}
                  <div className="mb-6">
                    <div className="inline-block p-4 md:p-6 bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] rounded-full mb-4 shadow-lg">
                      <svg
                        className="w-16 md:w-20 h-16 md:h-20 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Hero Text */}
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                    Welcome to NewsNexus
                  </h2>
                  <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-8">
                    An AI-powered web-application for aggregating and summarizing current world news using AI, with customizable filters for time, region, and type.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link
                      href="/login"
                      className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-lg hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-lg hover:shadow-xl font-semibold text-base md:text-lg"
                    >
                      Get Started - Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-6 md:px-8 py-3 md:py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-[#104AC2] hover:text-[#104AC2] transition-all font-semibold text-base md:text-lg"
                    >
                      Create Account
                    </Link>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-12">
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
                      <div className="text-3xl md:text-4xl mb-3">🌍</div>
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">
                        Global Coverage
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        News from Asia, Europe, America, and worldwide
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
                      <div className="text-3xl md:text-4xl mb-3">⏰</div>
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">
                        Real-Time Updates
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        Get news from the last hour to 24 hours
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
                      <div className="text-3xl md:text-4xl mb-3">📰</div>
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">
                        Multiple Categories
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        Science, Sports, Business, Technology & more
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </MainContent>
        }
        rightSidebar={<RightSidebar />}
      />

      {/* Floating AI Chat Button */}
      <Link
        href="/chat-with-ai"
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
      </Link>
    </>
  );
}

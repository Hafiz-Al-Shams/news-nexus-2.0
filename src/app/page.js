// src>app>page.js  (MODIFIED)
"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, logout as reduxLogout } from "@/store/slices/userSlice";
// REMOVED: openChat import. The floating chat button now lives in layout.js (ChatLauncher), so every page has it.
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
  // REMOVED: chatOpen selector (the ChatLauncher component hides itself while the modal is open)

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

      {/* REMOVED: the floating AI chat button that used to be here.
          It is now rendered once for the whole website by <ChatLauncher /> in layout.js (same look, same position). */}
    </div>
  );
}
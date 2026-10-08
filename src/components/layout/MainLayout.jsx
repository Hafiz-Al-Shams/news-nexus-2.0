"use client";

export default function MainLayout({ leftSidebar, mainContent, rightSidebar }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar - Hidden on mobile, reduced width on tablet, normal on desktop */}
      <aside className="hidden md:block md:w-50 lg:w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        {leftSidebar}
      </aside>

      {/* Main Content - Always visible, flexible width */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {mainContent}
      </main>

      {/* Right Sidebar - Only visible on large screens */}
      <aside className="hidden lg:block w-[32rem] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        {rightSidebar}
      </aside>
    </div>
  );
}

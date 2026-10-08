"use client";

export default function MainContent({ children }) {
  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
}
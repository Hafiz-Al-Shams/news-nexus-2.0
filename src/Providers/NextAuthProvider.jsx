// src>Providers>NextAuthProvider.jsx  (MODIFIED)
"use client";

import { SessionProvider } from "next-auth/react";

// CHANGED: accepts the session that layout.js read on the server
export default function NextAuthProvider({ children, session }) {
  // Giving SessionProvider the starting session means status is "authenticated" immediately (no "loading" phase)
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
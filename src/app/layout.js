// src>app>layout.js  (MODIFIED)
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth"; // reads the login session on the server
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // same auth settings the API routes use
import NextAuthProvider from "@/Providers/NextAuthProvider";
import ReduxProvider from "@/Providers/ReduxProvider";
import PresenceHeartbeat from "@/components/PresenceHeartbeat";
import ThemeToggle from "@/components/ThemeToggle"; // light/dark toggle button
import ChatModal from "@/components/ChatModal"; // the AI chat modal (opens from the bottom-right on any page)
import ChatLauncher from "@/components/ChatLauncher"; // NEW: the floating "Chat with AI" button, now on every page
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NewsNexus - AI-Powered News Aggregator",
  description: "AI-powered web-application for aggregating and summarizing current world news",
};

// Runs before the page paints, so a saved dark theme is applied instantly (no white flash on reload)
const themeInitScript = `
  try {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
`;

// The layout is async so it can read the session before sending the page to the browser
export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions); // null if logged out, user data if logged in

  return (
    // suppressHydrationWarning, because the script above adds the "dark" class to <html> before React loads
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning // browser extensions (e.g. ColorZilla) add attributes to <body>; this stops the false hydration warning
      >
        <ReduxProvider>
          {/* The server session is handed over, so useSession() knows the answer from the first paint */}
          <NextAuthProvider session={session}>
            {/* Must be inside NextAuthProvider because it uses useSession */}
            <PresenceHeartbeat />
            {children}
            {/* Toast colors come from CSS variables, so toasts also follow light/dark mode */}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-text)",
                },
              }}
            />
            {/* Floating theme toggle, visible on every page */}
            <ThemeToggle />
            {/* NEW: floating "Chat with AI" button on every page (globals.css hides it on the not-found page).
                Needs Redux (opens the modal), so it lives inside the providers. */}
            <ChatLauncher />
            {/* Chat modal, needs both Redux (open/close) and the session (login check), so it lives inside both providers */}
            <ChatModal />
          </NextAuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
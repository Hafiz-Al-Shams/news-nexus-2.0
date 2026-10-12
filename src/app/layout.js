import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/Providers/NextAuthProvider";
import ReduxProvider from "@/Providers/ReduxProvider";
import PresenceHeartbeat from "@/components/PresenceHeartbeat";
import ThemeToggle from "@/components/ThemeToggle"; // NEW: light/dark toggle button
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

// NEW: runs before the page paints, so a saved dark theme is applied instantly (no white flash on reload)
const themeInitScript = `
  try {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    // NEW: suppressHydrationWarning, because the script above adds the "dark" class to <html> before React loads
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning // browser extensions (e.g. ColorZilla) add attributes to <body>; this stops the false hydration warning
      >
        <ReduxProvider>
          <NextAuthProvider>
            {/* Must be inside NextAuthProvider because it uses useSession */}
            <PresenceHeartbeat />
            {children}
            {/* CHANGED: toast colors now come from CSS variables, so toasts also follow light/dark mode */}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-text)",
                },
              }}
            />
            {/* NEW: floating theme toggle, visible on every page */}
            <ThemeToggle />
          </NextAuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
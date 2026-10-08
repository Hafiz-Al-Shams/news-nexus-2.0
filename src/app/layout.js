import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/Providers/NextAuthProvider";
import ReduxProvider from "@/Providers/ReduxProvider";
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <NextAuthProvider>
            {children}
            <Toaster position="top-center" />
          </NextAuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}


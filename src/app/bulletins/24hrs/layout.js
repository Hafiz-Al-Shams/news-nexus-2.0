// src>app>bulletins>24hrs>layout.js  (NEW)
// The bulletin page is a client component ("use client"), so it cannot export metadata itself.
// This small server layout gives the page a proper title + preview text (used by Facebook, X, WhatsApp, Google ...).

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://news-nexus-v2.vercel.app"; // same domain as the newsletter script

export const metadata = {
  metadataBase: new URL(SITE_URL), // lets Next.js turn relative links below into full links
  title: "24hrs News Bulletin | NewsNexus",
  description: "The 12 most important world stories of the last 24 hours, summarized by AI.",
  openGraph: {
    title: "24hrs News Bulletin | NewsNexus",
    description: "The 12 most important world stories of the last 24 hours, summarized by AI.",
    url: "/bulletins/24hrs",
    siteName: "NewsNexus",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "24hrs News Bulletin | NewsNexus",
    description: "The 12 most important world stories of the last 24 hours, summarized by AI.",
  },
};

export default function BulletinLayout({ children }) {
  return children; // no extra markup, the page renders exactly as before
}
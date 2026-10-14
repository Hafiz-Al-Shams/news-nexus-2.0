// src>app>privacy>page.jsx  (NEW)
import StaticPageLayout from "@/components/StaticPageLayout";
import LegalDocument from "@/components/LegalDocument";

export const metadata = {
  title: "Privacy Policy | NewsNexus",
  description: "How NewsNexus collects, uses and protects your personal information.",
};

// DEMO TEXT: describes how this project works, but have a lawyer review it before you launch publicly
const SECTIONS = [
  {
    id: "collect",
    title: "Information we collect",
    paragraphs: ["We collect only what we need to run NewsNexus:"],
    bullets: [
      "Account details: your name and email address, plus a securely hashed password if you sign up with email, or basic profile details if you use Google sign-in.",
      "Content you submit: reviews, ratings, and messages you send to the AI chat assistant.",
      "Newsletter details: your email address, if you subscribe to the daily newsletter.",
      "Activity data: a \"last seen\" time while you are logged in, and the AI summaries you request (to apply usage limits).",
    ],
  },
  {
    id: "use",
    title: "How we use your information",
    bullets: [
      "To create and secure your account and keep you logged in.",
      "To generate AI summaries and chat answers that you request.",
      "To send the daily newsletter you signed up for.",
      "To apply fair-use limits, prevent abuse and improve the service.",
    ],
    paragraphs: ["We do not sell your personal information."],
  },
  {
    id: "ai",
    title: "AI processing",
    paragraphs: [
      "When you request a summary or use the chat assistant, the relevant text (such as an article's content or your chat message) is sent to Google's Gemini AI service to produce a reply. Please do not share sensitive personal information in the chat.",
      "Generated summaries and daily bulletins may be stored temporarily (for up to 24 hours) so they can be shown quickly to other readers.",
    ],
  },
  {
    id: "third-parties",
    title: "Service providers",
    paragraphs: ["We rely on trusted services to run NewsNexus. They only receive the data needed for their job:"],
    bullets: [
      "The Guardian: source of the news articles shown on the site.",
      "Google: sign-in with Google and the Gemini AI service.",
      "Kit: sending the daily newsletter to subscribers.",
      "MongoDB and our hosting provider: storing and serving our data.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    paragraphs: [
      "We use a secure session cookie to keep you signed in, and your browser's local storage to remember your light or dark theme choice. We do not use advertising cookies.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep data",
    paragraphs: [
      "Account data is kept while your account is active. Cached news, summaries and bulletins are automatically deleted after a short period. Newsletter details are kept until you unsubscribe. You can ask us to delete your data at any time.",
    ],
  },
  {
    id: "rights",
    title: "Your choices and rights",
    bullets: [
      "Ask for a copy of the personal data we hold about you.",
      "Ask us to correct or delete your data.",
      "Unsubscribe from the newsletter with one click from any email.",
      "Stop using the service and close your account whenever you wish.",
    ],
    paragraphs: ["To use any of these rights, email us using the address below."],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "Passwords are stored as one-way hashes, connections are encrypted, and administrator access is restricted. No system is perfectly secure, but we work to protect your information and fix problems quickly.",
    ],
  },
  {
    id: "children",
    title: "Children and policy changes",
    paragraphs: [
      "NewsNexus is not directed at children under 13, and we do not knowingly collect their data. If we change this policy, we will update the date at the top of this page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      pageTitle="Privacy Policy"
      eyebrow="Your data, your control"
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and how you stay in control. Written in plain language."
      widthClass="max-w-6xl"
    >
      <LegalDocument
        updated="October 14, 2026"
        intro="Your privacy matters to us. This policy explains what information NewsNexus collects when you use the website, how it is used, and the choices you have."
        sections={SECTIONS}
        contactEmail="privacy@newsnexus.example"
      />
    </StaticPageLayout>
  );
}
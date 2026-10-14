// src>app>terms>page.jsx  (NEW)
import StaticPageLayout from "@/components/StaticPageLayout";
import LegalDocument from "@/components/LegalDocument";

export const metadata = {
  title: "Terms of Use | NewsNexus",
  description: "The rules for using the NewsNexus website and its AI-powered features.",
};

// DEMO TEXT: have a lawyer review and adapt it before you launch publicly
const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    paragraphs: [
      "By accessing or using NewsNexus, you agree to these Terms of Use. If you do not agree, please do not use the website.",
      "We may update these terms from time to time. Continuing to use NewsNexus after a change means you accept the new version.",
    ],
  },
  {
    id: "service",
    title: "What NewsNexus provides",
    paragraphs: [
      "NewsNexus is a news aggregator that displays headlines from third-party publishers and offers AI-generated summaries, a daily bulletin, an AI chat assistant and an email newsletter.",
    ],
    bullets: [
      "Some features are free for everyone, while others (AI summaries, AI chat, reviews, newsletter) need an account.",
      "We may change, pause or remove any feature at any time without notice.",
      "We may apply fair-use limits, for example a maximum number of AI summaries per hour and per day.",
    ],
  },
  {
    id: "accounts",
    title: "Your account",
    paragraphs: [
      "You can sign up with an email and password or with your Google account. You are responsible for keeping your login details safe and for everything that happens under your account.",
    ],
    bullets: [
      "Provide accurate information when you register.",
      "Tell us immediately if you think someone else is using your account.",
      "We may suspend or close accounts that break these terms.",
    ],
  },
  {
    id: "ai-content",
    title: "AI-generated content",
    paragraphs: [
      "Summaries, bulletins and chat answers are produced by generative AI. They are meant to help you get started, not to replace the original reporting.",
      "AI can make mistakes or leave out important context. Always check the original article before relying on a summary for decisions about health, money, legal matters or safety.",
    ],
  },
  {
    id: "third-party",
    title: "Third-party news and links",
    paragraphs: [
      "Articles, headlines and images come from third-party publishers such as The Guardian and remain the property of their owners. NewsNexus is not responsible for the content or availability of external websites.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: ["When using NewsNexus you agree not to:"],
    bullets: [
      "Attempt to break, overload or gain unauthorized access to the website or its systems.",
      "Use bots or scripts to bypass usage limits or collect data in bulk.",
      "Submit unlawful, abusive or misleading content in reviews or chat.",
      "Copy, resell or redistribute our summaries as your own commercial product.",
    ],
  },
  {
    id: "ip",
    title: "Intellectual property",
    paragraphs: [
      "The NewsNexus name, logo, design and software are owned by us or our licensors. You may not copy or reuse them without written permission. Content you submit (such as reviews) stays yours, but you give us permission to display it on the site.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimers and liability",
    paragraphs: [
      "NewsNexus is provided \"as is\" and \"as available\", without promises that it will always be accurate, uninterrupted or error-free.",
      "To the fullest extent allowed by law, we are not liable for any indirect or consequential loss that results from using the website or relying on AI-generated content.",
    ],
  },
  {
    id: "contact",
    title: "Changes and contact",
    paragraphs: [
      "If you have any questions about these terms, contact us using the details below or through our Contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <StaticPageLayout
      pageTitle="Terms of Use"
      eyebrow="Legal"
      title="Terms of Use"
      subtitle="The simple ground rules for using NewsNexus. Please take a minute to read them."
      widthClass="max-w-6xl"
    >
      <LegalDocument
        updated="October 14, 2026"
        intro="Welcome to NewsNexus. These terms explain how you may use our website and services. We have tried to keep them clear and readable."
        sections={SECTIONS}
        contactEmail="legal@newsnexus.example"
      />
    </StaticPageLayout>
  );
}
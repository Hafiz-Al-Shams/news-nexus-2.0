// src>app>about>page.jsx  (NEW)
import Link from "next/link";
import StaticPageLayout, { Icon, SectionHeading } from "@/components/StaticPageLayout";

export const metadata = {
  title: "About Us | NewsNexus",
  description: "Learn how NewsNexus turns the world's news into short, AI-powered summaries for busy minds.",
};

// Numbers shown in the mission block (they match how the app really works)
const STATS = [
  { value: "12", label: "Top stories in every bulletin" },
  { value: "24h", label: "News window we analyze" },
  { value: "3h", label: "Bulletin refresh cycle" },
  { value: "10+", label: "Topic categories to explore" },
];

// "How it works" steps
const STEPS = [
  { icon: "globe", title: "We collect", text: "Fresh stories from trusted publishers are gathered from around the world throughout the day." },
  { icon: "sparkles", title: "AI prioritizes", text: "Generative AI ranks what matters most and condenses it into 12 clear, standalone bullet points." },
  { icon: "bolt", title: "You catch up fast", text: "Read the quick summary, open a detailed card, or have it read aloud, all in a couple of minutes." },
];

// Company values
const VALUES = [
  { icon: "shield", title: "Accuracy first", text: "Summaries stick to the facts in the source material. We never invent details." },
  { icon: "eye", title: "Transparency", text: "Every AI-written piece is labeled, and the original article is always one click away." },
  { icon: "heart", title: "Respect for your time", text: "No endless scrolling. You get the essentials, then you get on with your day." },
  { icon: "users", title: "Open to everyone", text: "Reading the news is free, and the site works on any screen, in light or dark mode." },
];

// Demo team members (placeholder names)
const TEAM = [
  { name: "Amina Rahman", role: "Founder & CEO", initials: "AR" },
  { name: "Daniel Foster", role: "Head of Engineering", initials: "DF" },
  { name: "Priya Nair", role: "Lead Product Designer", initials: "PN" },
  { name: "Omar Haddad", role: "AI & Data Lead", initials: "OH" },
];

export default function AboutPage() {
  return (
    <StaticPageLayout
      pageTitle="About Us"
      eyebrow="Our story"
      title="News that respects your time"
      subtitle="NewsNexus uses AI to turn a flood of headlines into short, trustworthy summaries, so busy minds stay informed without the overload."
    >
      {/* ===== Mission + stats ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <SectionHeading
            eyebrow="Our mission"
            title="Make staying informed effortless"
          />
          <div className="mt-4 space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base">
            <p>
              There is more news than anyone can read. NewsNexus was built to close that gap: we gather the day&apos;s
              most important stories, rank them with AI, and present them in a calm, clutter-free way.
            </p>
            <p>
              Whether you have thirty seconds or thirty minutes, you can get the full picture, from a quick 12-point
              bulletin to deeper story cards and one-tap AI summaries of any article.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#104AC2]/40 transition-all duration-300"
            >
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section>
        <SectionHeading
          center
          eyebrow="How it works"
          title="From headlines to clarity in three steps"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="relative bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#104AC2]/40 transition-all duration-300"
            >
              <span className="absolute top-5 right-5 text-xs font-bold text-gray-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="w-11 h-11 rounded-xl bg-blue-50 text-[#104AC2] flex items-center justify-center mb-4">
                <Icon name={step.icon} className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Values ===== */}
      <section>
        <SectionHeading
          center
          eyebrow="What we believe"
          title="Our values"
          subtitle="The principles behind every feature we build."
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="flex gap-4 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#104AC2]/40 transition-all duration-300"
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white flex items-center justify-center shadow-sm">
                <Icon name={value.icon} className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Team (demo data) ===== */}
      <section>
        <SectionHeading
          center
          eyebrow="The people"
          title="Meet the team"
          subtitle="A small group of editors, engineers and designers who love good news products."
        />
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#104AC2]/40 transition-all duration-300"
            >
              {/* Avatar with initials (no photos needed) */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4 shadow-md">
                {member.initials}
              </div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">{member.name}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Call to action ===== */}
      <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Want to be part of the story?</h2>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Join our team, or tell us how we can make NewsNexus better.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/careers"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1C3B7A] to-[#104AC2] text-white rounded-xl hover:from-[#153163] hover:to-[#0d3a9f] transition-all shadow-lg hover:shadow-xl font-semibold text-sm"
          >
            See open roles
            <Icon name="arrowRight" className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
          >
            Contact us
          </Link>
        </div>
      </section>
    </StaticPageLayout>
  );
}
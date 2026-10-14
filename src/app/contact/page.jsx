// src>app>contact>page.jsx  (NEW)
"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import StaticPageLayout, { Icon } from "@/components/StaticPageLayout";

// Demo contact details (replace with your real ones)
const CONTACT_CARDS = [
  { icon: "mail", title: "Email us", value: "support@newsnexus.example", note: "We reply within one business day" },
  { icon: "clock", title: "Support hours", value: "Mon - Fri, 9 AM - 6 PM", note: "Dhaka time (UTC+6)" },
  { icon: "pin", title: "Our base", value: "Dhaka, Bangladesh", note: "Remote-first team worldwide" },
];

const TOPICS = ["General question", "Technical problem", "Account & login", "Newsletter", "Feedback or idea", "Press & partnerships"];

const MAX_MESSAGE = 1000; // message length limit

// Same input look as the login / signup forms
const inputClass =
  "w-full px-4 py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#104AC2] focus:border-transparent disabled:opacity-50 transition-all";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [sending, setSending] = useState(false);

  // One handler updates any field (uses the input's name attribute)
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    // DEMO ONLY: the message is not sent anywhere yet.
    // Later, replace this timer with a fetch() call to your own API route (e.g. /api/contact).
    await new Promise((resolve) => setTimeout(resolve, 900));

    toast.success("Thanks! Your message has been received (demo).");
    setForm({ name: "", email: "", topic: TOPICS[0], message: "" }); // clear the form
    setSending(false);
  };

  return (
    <StaticPageLayout
      pageTitle="Contact"
      eyebrow="Get in touch"
      title="We'd love to hear from you"
      subtitle="Questions, feedback or partnership ideas? Send us a message and a real person will get back to you."
      widthClass="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 lg:gap-8 items-start">
        {/* ===== Contact form ===== */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Send us a message</h2>
          <p className="text-sm text-gray-600 mb-6">Fields marked with * are required.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">Full name *</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  disabled={sending}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">Email address *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  disabled={sending}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Topic */}
            <div>
              <label htmlFor="contact-topic" className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <select
                id="contact-topic"
                name="topic"
                value={form.topic}
                onChange={handleChange}
                disabled={sending}
                className={inputClass}
              >
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            {/* Message + live character counter */}
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={6}
                maxLength={MAX_MESSAGE}
                value={form.message}
                onChange={handleChange}
                disabled={sending}
                placeholder="How can we help?"
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {form.message.length}/{MAX_MESSAGE} characters
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#104AC2] to-[#1C3B7A] hover:from-[#0d3da3] hover:to-[#152f61] text-white font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-md hover:shadow-lg"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending...
                </>
              ) : (
                <>
                  Send message
                  <Icon name="arrowRight" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </section>

        {/* ===== Side cards ===== */}
        <aside className="space-y-4">
          {CONTACT_CARDS.map((card) => (
            <div
              key={card.title}
              className="flex gap-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#104AC2]/40 transition-all duration-300"
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-50 text-[#104AC2] flex items-center justify-center">
                <Icon name={card.icon} className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{card.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{card.note}</p>
              </div>
            </div>
          ))}

          {/* Pointer to the Help Center for quick answers */}
          <div className="rounded-2xl bg-gradient-to-br from-[#1C3B7A] to-[#104AC2] text-white p-5 shadow-lg">
            <p className="font-bold mb-1">Looking for a quick answer?</p>
            <p className="text-sm text-white/80 mb-4">Many common questions are already answered in our Help Center.</p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors"
            >
              Visit Help Center
              <Icon name="arrowRight" className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      </div>
    </StaticPageLayout>
  );
}
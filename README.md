# NewsNexus - AI-Powered News Website

![NewsNexus-HomePage Screenshot](/public/NewsNexus-HomePage.webp)

## Live Project  
🔗 [NewsNexus Live](https://news-nexus-v2.vercel.app/)

## Overview  
NewsNexus is a responsive news website built around current Guardian stories and AI-assisted reading. Visitors can browse and filter the latest news, search the Guardian archive, and read a pre-generated daily AI bulletin. Signing in unlocks additional features such as AI article summaries, the NewsNexus AI chat assistant, reader reviews, and the newsletter page.

It is a full-stack application built with **Next.js 15** and **React 19**. It uses MongoDB with Mongoose to store accounts, cached news, bulletins, reviews, and usage limits, Google Gemini for the AI features, and Kit for newsletter subscriptions and broadcasts.

## Technologies Used  
- **Frontend:** Next.js (App Router), React, React Icons
- **Styling:** Tailwind CSS
- **Backend & Database:** Next.js API Routes, MongoDB, Mongoose
- **Authentication & Security:** NextAuth.js (Credentials + Google), bcrypt password hashing, role-based access
- **State Management & Utilities:** Redux Toolkit, React Redux, Papaparse
- **AI Integration:** Google Gemini (`@google/genai`)
- **News Data:** The Guardian API
- **Newsletter & Automation:** Kit (email subscriptions & broadcasts), GitHub Actions (scheduled jobs)
- **UI Enhancements:** SweetAlert2, React Hot Toast
- **Code Quality:** ESLint

## Key Features  

✅ **Homepage News Feed:** Responsive news cards showing the image, headline, short description, source, author, and publication time. Each card offers **View Original** and **Summarize with AI**. The default feed is The Guardian, Last 24 Hours, All Topics.  

✅ **Time and Topic Filters:** Filter news by time period (Last 1 Hour, Last 24 Hours, Last 3 Days, Last 7 Days) and by topic (All Topics, Politics, Business, Technology, Environment, Sport, Health, Science, Education, Books, Travel). Filters are applied when the reader presses **Get The News**.  

✅ **Guardian Archive Search:** Searches the full Guardian archive, not just the selected date range. Includes a 700 ms debounce, a two-character minimum, whitespace and case normalization, relevance ordering, and load-more pagination.  

✅ **Pagination, Caching & Service Fallbacks:**  
  - News and search results load in pages of 30 articles, with a server-side cap of 300 articles per feed or search  
  - Guardian results are cached in MongoDB, and fresh cached pages are served for about 12 hours  
  - Older saved pages act as a fallback if the Guardian API is unavailable  
  - Identical in-progress requests share a single Guardian API call  

✅ **AI Article Summaries:** Signed-in readers can generate a concise headline and an approximately eight-sentence summary with Gemini. The server tries to retrieve the full article text and falls back to the article description. Summaries are cached for about 24 hours, with limits of 10 new summaries per hour and 100 per day per account.  

✅ **24-Hour AI News Bulletin:**  
  - A scheduled GitHub Actions job (every three hours) fetches the past 24 hours of Guardian stories and asks Gemini to select and summarize 12 key stories, plus 12 expanded story cards  
  - Generated content is stored in MongoDB, so visitors see prepared results instead of triggering new AI generations  
  - Readers can switch between the short numbered version and expanded details  
  - Listen to the bulletin using browser speech support  
  - Share through Facebook, X, or the device's sharing features for Instagram  
  - Signed-in readers can submit a review  

✅ **NewsNexus Assistant (AI Chat):** A floating chat launcher for signed-in users, focused on NewsNexus and its news data. The server adds the latest stored bulletin and default homepage-feed data to Gemini's context. It has a 500-character message limit, limited conversation history, and both per-account and global daily limits, which are configurable through environment variables.  

✅ **Signup, Login, and Social Authentication:** Create an account with name, email, and password (hashed before storage), or sign in with Google through NextAuth.js. The main feed and bulletin stay open to everyone, while summaries, chat, reviews, and the newsletter page require login.  

✅ **Reader Reviews:** Signed-in readers can leave a star rating and comment. Public reviews start as pending and appear only after admin approval. The displayed site rating combines approved reviews with three permanent starter reviews.  

✅ **Newsletter:** A newsletter page with an embedded Kit subscription form. A separate GitHub Actions workflow reads the latest stored bulletin and creates the daily email broadcast in Kit.  

✅ **Admin Dashboard:**  
  - View users and see who has been recently active through periodic presence heartbeats  
  - Inspect newsletter subscribers and their Kit status  
  - Moderate reviews: approve, reject, return to pending, or delete  
  - Admin access is verified against the user's database role in the API routes  

✅ **Theme Toggle (Dark/Light):**  
  - Persistent light and dark mode switch  
  - Saves user preference in `localStorage`  

✅ **Responsive Design:** Fully responsive layouts with a mobile menu and user menu for phone, tablet, and desktop screens.

---

## Dependencies  
The following dependencies are used in the project:  

```json
{
  "dependencies": {
    "@google/genai": "^1.21.0",
    "@reduxjs/toolkit": "^2.9.0",
    "bcrypt": "^6.0.0",
    "mongoose": "^8.18.3",
    "next": "^15.5.27",
    "next-auth": "^4.24.11",
    "papaparse": "^5.5.3",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-hot-toast": "^2.6.0",
    "react-icons": "^5.5.0",
    "react-redux": "^9.2.0",
    "sweetalert2": "^11.23.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "^15.5.27",
    "tailwindcss": "^4"
  }
}
```

## Installation & Running Locally  
Follow these steps to run the project locally:

1. **Clone the repository:**  
   ```sh
   git clone https://github.com/Hafiz-Al-Shams/news-nexus-2.0.git
   cd news-nexus-2.0
   ```

2. **Install dependencies:**  
   ```sh
   npm install
   ```

3. **Set up environment variables:**  
   Create a `.env.local` file in the root directory and add the following variables:

   ```sh
   NEXT_PUBLIC_IMAGE_HOSTING_KEY=YOUR_IMAGE_HOSTING_KEY
   MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   NEWS_API_KEY=YOUR_NEWS_API_KEY
   GUARDIAN_API_KEY=YOUR_GUARDIAN_API_KEY
   KIT_API_KEY=YOUR_KIT_API_KEY
   KIT_FORM_ID=YOUR_KIT_FORM_ID

   # Chat assistant limits (optional)
   # Messages per user per 24h (default: 10)
   CHAT_USER_LIMIT=8
   # Successful answers per UTC day for ALL users (default: 500)
   CHAT_GLOBAL_DAILY_LIMIT=500
   ```

4. **Start the development server:**  
   ```sh
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

> **Note:** The 24-hour bulletin and the newsletter broadcast are generated by scheduled GitHub Actions workflows (`.github/workflows/bulletin-cron.yml` and `.github/workflows/newsletter-cron.yml`). To run them in your own fork, add the required keys (database, Guardian, Gemini, and Kit) as GitHub repository secrets. Until a bulletin has been generated, the bulletin page and the chat assistant's news context will be empty.

## Additional Resources  
- [Next.js Documentation](https://nextjs.org/docs)
- [Guardian Open Platform](https://open-platform.theguardian.com/documentation/)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [NextAuth.js](https://next-auth.js.org/getting-started/introduction)
- [Mongoose](https://mongoosejs.com/docs/)

---

🚀 **Developed by Hafiz Al Shams**
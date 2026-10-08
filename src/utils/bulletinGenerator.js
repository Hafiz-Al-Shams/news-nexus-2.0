// src/utils/bulletinGenerator.js
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});


/**
 * Fetch top 25 Guardian articles from past 24 hours
 */
async function fetchTop25GuardianArticles() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
        'api-key': process.env.GUARDIAN_API_KEY,
        'from-date': oneDayAgo,

        // 'order-by': 'relevance',
        'q': 'breaking news world',  // ← Added query
        'order-by': 'relevance',

        'page-size': '25',
        'show-fields': 'headline,trailText,thumbnail,bodyText'
    });

    const response = await fetch(
        `https://content.guardianapis.com/search?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error(`Guardian API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response?.results || [];
}

/**
 * Generate 12 bullet points from articles using Gemini
 */
async function generateBullets(articles) {
    const articleSummaries = articles.map((article, idx) => {
        return `${idx + 1}. ${article.webTitle}\n${article.fields?.trailText || 'No description available'}`;
    }).join('\n\n');

    const prompt = `You are a world-class news editor. Analyze these 25 top news stories from the past 24 hours and create EXACTLY 12 bullet points representing the most important global news.

CRITICAL REQUIREMENTS:
- EXACTLY 12 bullets (no more, no less)
- Each bullet must be 1-2 concise sentences
- Prioritize: Breaking news > Major developments > Significant events
- Cover diverse topics (politics, economy, technology, health, environment, etc.)
- Focus on factual information, avoid speculation
- Write in present tense where appropriate
- Each bullet should be standalone and clear

Articles to analyze:
${articleSummaries}

Format: Return ONLY the 12 bullets, one per line, no numbering, no extra text.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error("No valid response from Gemini");
    }

    // Parse bullets
    const bullets = responseText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^\d+\./))
        .slice(0, 12);

    if (bullets.length !== 12) {
        throw new Error(`Expected 12 bullets, got ${bullets.length}`);
    }

    return bullets;
}

/**
 * Main function: Generate 24hrs bulletin
 */
export async function generate24HrsBulletin() {
    const startTime = Date.now();

    try {
        const articles = await fetchTop25GuardianArticles();

        if (articles.length === 0) {
            throw new Error('No articles found from Guardian API');
        }

        const bullets = await generateBullets(articles);

        const processingTime = Date.now() - startTime;

        return {
            bullets,
            sourceArticles: articles.map(a => ({
                title: a.webTitle,
                url: a.webUrl,
                publishedAt: a.webPublicationDate
            })),
            metadata: {
                guardianArticlesFetched: articles.length,
                processingTimeMs: processingTime
            }
        };
    } catch (error) {
        console.error('Bulletin generation error:', error);
        throw error;
    }
}

/**
 * Expand bullets into detailed cards using Gemini
 */
export async function expandBulletsToDetails(bullets) {
    const bulletsText = bullets.map((bullet, idx) => `${idx + 1}. ${bullet}`).join('\n\n');

    const prompt = `You are a news analyst. Take these 12 news bullet points and expand EACH into a detailed card with:
- A compelling TITLE (5-10 words)
- A detailed DESCRIPTION (3-4 sentences with context, implications, and key facts)

CRITICAL: Return EXACTLY 12 cards in valid JSON format:
[
  {"title": "...", "description": "..."},
  {"title": "...", "description": "..."},
  ...
]

Bullets to expand:
${bulletsText}

Return ONLY the JSON array, no markdown, no extra text.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error("No valid response from Gemini");
    }

    // Clean and parse JSON
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const cards = JSON.parse(cleanedText);

    if (!Array.isArray(cards) || cards.length !== 12) {
        throw new Error(`Expected 12 cards, got ${cards.length}`);
    }

    return cards;
}
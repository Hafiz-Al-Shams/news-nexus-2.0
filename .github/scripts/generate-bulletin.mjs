// .github/scripts/generate-bulletin.mjs
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Define schema inline (outside Next.js context)
const BulletinCacheSchema = new mongoose.Schema({
    timeframe: {
        type: String,
        required: true,
        enum: ['24hrs'],
        default: '24hrs'
    },
    bullets: {
        type: [String],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length === 12;
            },
            message: 'Must have exactly 12 bullets'
        }
    },
    detailedCards: [{
        title: { type: String, required: true },
        description: { type: String, required: true }
    }],
    sourceArticles: [{
        title: String,
        url: String,
        publishedAt: Date
    }],
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    generationMetadata: {
        guardianArticlesFetched: Number,
        processingTimeMs: Number,
        detailsGeneratedAt: Date
    }
});

BulletinCacheSchema.index({ timeframe: 1, expiresAt: 1 });
BulletinCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BulletinCache = mongoose.models.BulletinCache || mongoose.model('BulletinCache', BulletinCacheSchema);

// Copy your functions (they're perfect as-is)
async function fetchTop25GuardianArticles() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
        'api-key': process.env.GUARDIAN_API_KEY,
        'from-date': oneDayAgo,
        'q': 'breaking news world',
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
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error("No valid response from Gemini");
    }

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

async function expandBulletsToDetails(bullets) {
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
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error("No valid response from Gemini");
    }

    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const cards = JSON.parse(cleanedText);

    if (!Array.isArray(cards) || cards.length !== 12) {
        throw new Error(`Expected 12 cards, got ${cards.length}`);
    }

    return cards;
}

// Main execution
async function main() {
    const overallStart = Date.now();

    try {
        console.log('Starting bulletin generation...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Step 1: Fetch articles
        console.log('Fetching Guardian articles...');
        const articles = await fetchTop25GuardianArticles();
        console.log(`Fetched ${articles.length} articles`);

        // Step 2: Generate bullets
        console.log('Generating 12 bullets...');
        const bullets = await generateBullets(articles);
        console.log(`Generated ${bullets.length} bullets`);

        // Step 3: Expand to detailed cards
        console.log('Expanding to detailed cards...');
        const detailedCards = await expandBulletsToDetails(bullets);
        console.log(`Generated ${detailedCards.length} detailed cards`);

        const processingTime = Date.now() - overallStart;

        // Step 4: Save to database
        console.log('Saving to database...');
        
        // Delete old bulletins
        await BulletinCache.deleteMany({ timeframe: '24hrs' });

        // Create new bulletin with both bullets and detailed cards
        await BulletinCache.create({
            timeframe: '24hrs',
            bullets,
            detailedCards,
            sourceArticles: articles.map(a => ({
                title: a.webTitle,
                url: a.webUrl,
                publishedAt: a.webPublicationDate
            })),
            expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
            generationMetadata: {
                guardianArticlesFetched: articles.length,
                processingTimeMs: processingTime,
                detailsGeneratedAt: new Date()
            }
        });

        console.log('Bulletin saved successfully!');
        console.log(`Total processing time: ${processingTime}ms`);

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Error generating bulletin:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

main();
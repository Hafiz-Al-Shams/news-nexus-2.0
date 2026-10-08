// src/utils/guardian.js
// Helper function to build Guardian API URLs with proper parameters

export function buildGuardianUrl({
  q,
  tags,
  section,
  fromDate,
  toDate,
  pageSize = 20,
  page = 1,
  orderBy = 'newest',
  showFields = [],
  showTags = [],
  showMostViewed = false,
  apiKey
}) {
  const params = new URLSearchParams();

  // Search query
  if (q) params.set('q', q);

  // Tags for topic filtering
  if (tags) params.set('tag', tags);

  // Section filtering
  if (section) params.set('section', section);

  // Date filtering
  if (fromDate) params.set('from-date', fromDate);
  if (toDate) params.set('to-date', toDate);

  // Pagination
  params.set('page-size', String(pageSize));
  params.set('page', String(page));

  // Sorting
  params.set('order-by', orderBy);

  // Additional fields to include in response
  if (showFields && showFields.length) {
    params.set('show-fields', showFields.join(','));
  }

  // Tags to include
  if (showTags && showTags.length) {
    params.set('show-tags', showTags.join(','));
  }

  // Most viewed articles
  if (showMostViewed) {
    params.set('show-most-viewed', 'true');
  }

  // Use international edition for global coverage
  params.set('edition', 'international');

  // Response format
  params.set('format', 'json');

  // API key
  params.set('api-key', apiKey);

  return `https://content.guardianapis.com/search?${params.toString()}`;
}

// Helper to calculate time range
export function calculateTimeRange(timeValue) {
  const now = new Date();
  let hours;

  switch(timeValue) {
    case '1h':
      hours = 1;
      break;
    case '24h':
      hours = 24;
      break;
    case '3d':
      hours = 72;
      break;
    case '7d':
      hours = 168;
      break;
    default:
      hours = 24;
  }

  const past = new Date(Date.now() - hours * 3600 * 1000);

  return {
    fromDate: past.toISOString(),
    toDate: now.toISOString()
  };
}

// Map topics to Guardian sections/tags
export const GUARDIAN_TOPIC_MAP = {
  all: { section: null, tags: null },
  politics: { section: 'politics', tags: null },
  business: { section: 'business', tags: null },
  technology: { section: 'technology', tags: null },
  environment: { section: 'environment', tags: null },
  sport: { section: 'sport', tags: null },
  health: { section: 'society', tags: 'society/health' },
  science: { section: 'science', tags: null },
  education: { section: 'education', tags: null },
  books: { section: 'books', tags: null },
  travel: { section: 'travel', tags: null },
};
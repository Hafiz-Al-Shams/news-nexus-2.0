// src/utils/seedReviews.js  (NEW)
// The 3 permanent reviews that are ALWAYS shown at the top of the review section.
// Used by the server (to calculate the average) and by the browser (to show them instantly).

export const SEED_REVIEWS = [
  { id: "seed-1", userName: "John Doe", rating: 5, comment: "Great news platform!", createdAt: null },
  { id: "seed-2", userName: "Jane Smith", rating: 4, comment: "Very informative", createdAt: null },
  { id: "seed-3", userName: "Mike Johnson", rating: 5, comment: "Love the AI summaries", createdAt: null },
];

// Sum of the three permanent ratings (5 + 4 + 5 = 14)
export const SEED_RATING_SUM = SEED_REVIEWS.reduce((sum, review) => sum + review.rating, 0);

// Average rounded to ONE decimal, e.g. 4.7  (count = number of reviews, sum = total of all ratings)
export function computeAverage(count, sum) {
  if (!count) return 0;
  return Number((sum / count).toFixed(1));
}
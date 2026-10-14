// src>store>slices>reviewsSlice.js  (NEW)
// One shared place for the review list + average, so the right sidebar and the mobile accordion
// show the same data and only ONE request is made.
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { SEED_REVIEWS, SEED_RATING_SUM, computeAverage } from "@/utils/seedReviews";

const initialState = {
  // The 3 permanent reviews are available immediately (no empty flash while the server answers)
  items: SEED_REVIEWS,
  average: computeAverage(SEED_REVIEWS.length, SEED_RATING_SUM), // 4.7 at the start
  count: SEED_REVIEWS.length,
  loading: false,
  loaded: false, // true after the first successful load
  error: null,
};

// Loads the 3 permanent reviews + the APPROVED user reviews + the calculated average
export const fetchReviews = createAsyncThunk(
  "reviews/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/reviews", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) return rejectWithValue(data);
      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message, message: error.message });
    }
  },
  {
    // Two components ask for the reviews on the same page: the second request is skipped.
    // Pass { force: true } to reload even when the reviews were already loaded.
    condition: (arg, { getState }) => {
      const s = getState().reviews;
      if (s.loading) return false;
      return arg?.force === true || !s.loaded;
    },
  }
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.items = action.payload.reviews || SEED_REVIEWS; // permanent 3 first, approved ones after
        state.average = action.payload.average ?? state.average;
        state.count = action.payload.count ?? state.count;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load reviews";
        // the 3 permanent reviews stay visible even if loading fails
      });
  },
});

export default reviewsSlice.reducer;
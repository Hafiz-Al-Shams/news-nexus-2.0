// src>store>slices>newsSlice.js  (MODIFIED)
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  // NewsAPI data
  articles: [],
  loading: false,
  error: null,
  
  // Guardian API data
  guardianArticles: [],
  guardianLoading: false,       // true while the FIRST page of a filter is loading (spinner replaces the grid)
  guardianError: null,

  // Pagination ("Load More News") for the Guardian articles
  guardianPage: 0,              // last page that was loaded (0 = nothing loaded yet)
  guardianHasMore: false,       // true when the server says another page exists
  guardianLoadingMore: false,   // true while "Load More News" is loading (grid stays visible)
  guardianCachedAt: null,       // when the shown news was fetched from Guardian (for "News updated X ago")
  guardianTotal: 0,             // total number of matching articles reported by Guardian

  // The filters that the articles on screen were actually loaded with.
  // The "Get The News" button is enabled only when the selected filters differ from these.
  appliedFilters: {
    time: "24h",
    topic: "all",
  },

  // ===== NEW: SEARCH state =====
  searchInput: "",              // exactly what is typed in the search box (shared by the sidebar + mobile search box)
  searchKeyword: "",            // the cleaned keyword that is currently searched / shown ("" = search is off)
  searchResults: [],            // articles found for searchKeyword
  searchLoading: false,         // true while the FIRST page of a search is loading
  searchError: null,
  searchPage: 0,                // last search page that was loaded
  searchHasMore: false,         // true when "Load More" has more search results to load
  searchLoadingMore: false,     // true while "Load More" of the search is loading
  searchTotal: 0,               // total number of matches reported by Guardian
  searchCachedAt: null,         // when the shown search result was fetched from Guardian
  
  // 24hrs Bulletin data
  bulletin: {
    bullets: [],
    detailedCards: [],
    loading: false,
    error: null,
    lastFetched: null,
    cachedAt: null,
  },
  
  // Combined view
  combinedArticles: [],
  
  // Filters (what the user has currently selected in the filter buttons)
  filters: {
    time: "24h",
    topic: "all",
  },
  
  // Active news source
  activeSource: "guardian",
  
  lastFetched: null,
  guardianLastFetched: null,
};

// Fetch 24hrs bulletin (bullets AND detailed cards, both come from the same request now)
export const fetch24hrsBulletin = createAsyncThunk(
  'news/fetch24hrsBulletin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/bulletins/24hrs');
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message });
    }
  }
);

// Expand bulletin into detailed cards (kept as a fallback, only used if the cards did not arrive with the bulletin)
export const expandBulletinDetails = createAsyncThunk(
  'news/expandBulletinDetails',
  async (bullets, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/bulletins/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullets })
      });
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message });
    }
  }
);

// Async thunk for fetching NewsAPI articles
export const fetchNewsAPIArticles = createAsyncThunk(
  'news/fetchNewsAPI',
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        time: filters.time || '24h',
        topic: filters.topic || 'all'
      });
      
      const response = await fetch(`/api/news?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message });
    }
  }
);

// Async thunk for fetching the FIRST page (30 articles) of Guardian news for a filter
export const fetchGuardianArticles = createAsyncThunk(
  'news/fetchGuardian',
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        time: filters.time || '24h',
        topic: filters.topic || 'all',
        page: '1' // always the first page, "Load More" handles the following pages
      });
      
      const response = await fetch(`/api/guardian?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message, message: error.message });
    }
  },
  {
    // Ignore the request if a first-page load is already running (stops double requests, e.g. React dev double-mount)
    condition: (_, { getState }) => !getState().news.guardianLoading,
  }
);

// Loads the NEXT 30 articles for the filters currently shown and adds them below the existing ones
export const loadMoreGuardianArticles = createAsyncThunk(
  'news/loadMoreGuardian',
  async (_, { getState, rejectWithValue }) => {
    const { appliedFilters, guardianPage } = getState().news; // always continue the filters that are on screen
    try {
      const params = new URLSearchParams({
        time: appliedFilters.time,
        topic: appliedFilters.topic,
        page: String(guardianPage + 1) // next page
      });

      const response = await fetch(`/api/guardian?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message, message: error.message });
    }
  },
  {
    // Only run when more news exists and nothing else is loading
    condition: (_, { getState }) => {
      const s = getState().news;
      return s.guardianHasMore && !s.guardianLoading && !s.guardianLoadingMore;
    },
  }
);

// NEW: searches the WHOLE Guardian archive for a keyword (first page, 30 results)
// "signal" lets the component cancel an old search when the user types something new
export const fetchSearchResults = createAsyncThunk(
  'news/fetchSearch',
  async (keyword, { rejectWithValue, signal }) => {
    try {
      const params = new URLSearchParams({ q: keyword, page: '1' });

      const response = await fetch(`/api/guardian/search?${params.toString()}`, { signal });
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message, message: error.message });
    }
  },
  {
    // Skip when this exact keyword is already loading or already shown without an error
    // (an error is allowed through, so the "Try Again" button can search the same keyword again)
    condition: (keyword, { getState }) => {
      const s = getState().news;
      return !(s.searchKeyword === keyword && (s.searchLoading || !s.searchError));
    },
  }
);

// NEW: loads the NEXT 30 search results for the keyword on screen and adds them below the current ones
export const loadMoreSearchResults = createAsyncThunk(
  'news/loadMoreSearch',
  async (_, { getState, rejectWithValue }) => {
    const { searchKeyword, searchPage } = getState().news;
    try {
      const params = new URLSearchParams({
        q: searchKeyword,
        page: String(searchPage + 1), // next page
      });

      const response = await fetch(`/api/guardian/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error) {
      return rejectWithValue({ error: error.message, message: error.message });
    }
  },
  {
    // Only run when more results exist and nothing else is loading
    condition: (_, { getState }) => {
      const s = getState().news;
      return s.searchHasMore && !s.searchLoading && !s.searchLoadingMore;
    },
  }
);

const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setArticles: (state, action) => {
      state.articles = action.payload;
      state.lastFetched = new Date().toISOString();
      state.error = null;
    },
    setGuardianArticles: (state, action) => {
      state.guardianArticles = action.payload;
      state.guardianLastFetched = new Date().toISOString();
      state.guardianError = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setGuardianError: (state, action) => {
      state.guardianError = action.payload;
      state.guardianLoading = false;
    },
    setTimeFilter: (state, action) => {
      state.filters.time = action.payload;
    },
    setTopicFilter: (state, action) => {
      state.filters.topic = action.payload;
    },
    setActiveSource: (state, action) => {
      state.activeSource = action.payload;
      if (action.payload === 'combined') {
        state.combinedArticles = [
          ...state.articles,
          ...state.guardianArticles
        ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }
    },
    // NEW: saves what the user types in the search box (both search boxes share this value)
    setSearchInput: (state, action) => {
      state.searchInput = action.payload;
    },
    // NEW: turns search mode OFF and forgets the results (the normal news feed is shown again)
    clearSearchResults: (state) => {
      state.searchKeyword = "";
      state.searchResults = [];
      state.searchLoading = false;
      state.searchError = null;
      state.searchPage = 0;
      state.searchHasMore = false;
      state.searchLoadingMore = false;
      state.searchTotal = 0;
      state.searchCachedAt = null;
    },
    clearNews: (state) => {
      state.articles = [];
      state.guardianArticles = [];
      state.combinedArticles = [];
      state.error = null;
      state.guardianError = null;
      state.lastFetched = null;
      state.guardianLastFetched = null;
      // Also reset the pagination data
      state.guardianPage = 0;
      state.guardianHasMore = false;
      state.guardianLoadingMore = false;
      state.guardianCachedAt = null;
      state.guardianTotal = 0;
    },
    clearBulletin: (state) => {
      state.bulletin = {
        bullets: [],
        detailedCards: [],
        loading: false,
        error: null,
        lastFetched: null,
        cachedAt: null,
      };
    },
  },
  
  extraReducers: (builder) => {
    // NewsAPI reducers
    builder
      .addCase(fetchNewsAPIArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewsAPIArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload.articles || [];
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchNewsAPIArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch NewsAPI articles';
      });
    
    // Guardian reducers (first page of a filter)
    builder
      .addCase(fetchGuardianArticles.pending, (state) => {
        state.guardianLoading = true;
        state.guardianError = null;
      })
      .addCase(fetchGuardianArticles.fulfilled, (state, action) => {
        state.guardianLoading = false;
        state.guardianArticles = action.payload.articles || [];
        state.guardianLastFetched = new Date().toISOString();
        state.guardianError = null;
        // Pagination info + remember which filters these articles belong to
        state.guardianPage = action.payload.page || 1;
        state.guardianHasMore = !!action.payload.hasMore;
        state.guardianTotal = action.payload.total || 0;
        state.guardianCachedAt = action.payload.cachedAt || null;
        state.appliedFilters = {
          time: action.payload.filters?.time || action.meta.arg?.time || "24h",
          topic: action.payload.filters?.topic || action.meta.arg?.topic || "all",
        };
      })
      .addCase(fetchGuardianArticles.rejected, (state, action) => {
        state.guardianLoading = false;
        state.guardianError = action.payload?.message || 'Failed to fetch Guardian articles';
      });

    // Guardian "Load More News" reducers (adds the next page below the current articles)
    builder
      .addCase(loadMoreGuardianArticles.pending, (state) => {
        state.guardianLoadingMore = true;
      })
      .addCase(loadMoreGuardianArticles.fulfilled, (state, action) => {
        state.guardianLoadingMore = false;

        const { articles = [], page, hasMore, filters } = action.payload;

        // Ignore a late answer that belongs to older filters or an older page (user changed filters meanwhile)
        if (filters?.time !== state.appliedFilters.time || filters?.topic !== state.appliedFilters.topic) return;
        if (page !== state.guardianPage + 1) return;

        // Pages are cached at different moments, so skip any article that is already on screen
        const existingUrls = new Set(state.guardianArticles.map((a) => a.url));
        const newArticles = articles.filter((a) => !existingUrls.has(a.url));

        state.guardianArticles.push(...newArticles);
        state.guardianPage = page;
        state.guardianHasMore = !!hasMore;
      })
      .addCase(loadMoreGuardianArticles.rejected, (state) => {
        state.guardianLoadingMore = false; // the component shows an error toast, existing articles stay visible
      });

    // NEW: SEARCH reducers (first page of a keyword)
    builder
      .addCase(fetchSearchResults.pending, (state, action) => {
        state.searchKeyword = action.meta.arg; // search mode ON for this keyword
        state.searchLoading = true;
        state.searchError = null;
        state.searchResults = []; // old results belong to the previous keyword, so they are removed
        state.searchPage = 0;
        state.searchHasMore = false;
        state.searchLoadingMore = false;
        state.searchTotal = 0;
        state.searchCachedAt = null;
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        // Late answer for an older keyword (user typed something else meanwhile): ignore it
        if (action.meta.arg !== state.searchKeyword) return;

        state.searchLoading = false;
        state.searchResults = action.payload.articles || [];
        state.searchPage = action.payload.page || 1;
        state.searchHasMore = !!action.payload.hasMore;
        state.searchTotal = action.payload.total || 0;
        state.searchCachedAt = action.payload.cachedAt || null;
        state.searchError = null;
      })
      .addCase(fetchSearchResults.rejected, (state, action) => {
        // A cancelled search (the user kept typing) or an old keyword must not touch the screen
        if (action.meta.aborted || action.meta.arg !== state.searchKeyword) return;

        state.searchLoading = false;
        state.searchError = action.payload?.message || 'Failed to search news';
      });

    // NEW: SEARCH "Load More" reducers (adds the next page below the current results)
    builder
      .addCase(loadMoreSearchResults.pending, (state) => {
        state.searchLoadingMore = true;
      })
      .addCase(loadMoreSearchResults.fulfilled, (state, action) => {
        state.searchLoadingMore = false;

        const { articles = [], page, hasMore, keyword } = action.payload;

        // Ignore a late answer that belongs to an older keyword or an older page
        if (keyword !== state.searchKeyword) return;
        if (page !== state.searchPage + 1) return;

        // Skip any article that is already on screen
        const existingUrls = new Set(state.searchResults.map((a) => a.url));
        const newArticles = articles.filter((a) => !existingUrls.has(a.url));

        state.searchResults.push(...newArticles);
        state.searchPage = page;
        state.searchHasMore = !!hasMore;
      })
      .addCase(loadMoreSearchResults.rejected, (state) => {
        state.searchLoadingMore = false; // the component shows an error toast, existing results stay visible
      });
    
    // 24hrs Bulletin reducers
    builder
      .addCase(fetch24hrsBulletin.pending, (state) => {
        state.bulletin.loading = true;
        state.bulletin.error = null;
      })
      .addCase(fetch24hrsBulletin.fulfilled, (state, action) => {
        state.bulletin.loading = false;
        state.bulletin.bullets = action.payload.bullets || [];
        // The detailed cards arrive together with the bullets,
        // so "Show More Details" can open instantly without another request
        state.bulletin.detailedCards = action.payload.detailedCards || [];
        state.bulletin.lastFetched = new Date().toISOString();
        state.bulletin.cachedAt = action.payload.cachedAt;
        state.bulletin.error = null;
      })
      .addCase(fetch24hrsBulletin.rejected, (state, action) => {
        state.bulletin.loading = false;
        state.bulletin.error = action.payload?.message || 'Failed to fetch bulletin';
      });
    
    // Bulletin detail expansion reducers (fallback path only)
    builder
      .addCase(expandBulletinDetails.pending, (state) => {
        state.bulletin.loading = true;
        state.bulletin.error = null;
      })
      .addCase(expandBulletinDetails.fulfilled, (state, action) => {
        state.bulletin.loading = false;
        state.bulletin.detailedCards = action.payload.cards || [];
        state.bulletin.error = null;
      })
      .addCase(expandBulletinDetails.rejected, (state, action) => {
        state.bulletin.loading = false;
        state.bulletin.error = action.payload?.message || 'Failed to expand details';
      });
  }
});

export const {
  setLoading,
  setArticles,
  setGuardianArticles,
  setError,
  setGuardianError,
  setTimeFilter,
  setTopicFilter,
  setActiveSource,
  setSearchInput,      // NEW
  clearSearchResults,  // NEW
  clearNews,
  clearBulletin,
} = newsSlice.actions;

export default newsSlice.reducer;
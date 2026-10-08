// src/store/slices/newsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  // NewsAPI data
  articles: [],
  loading: false,
  error: null,
  
  // Guardian API data
  guardianArticles: [],
  guardianLoading: false,
  guardianError: null,
  
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
  
  // Filters
  filters: {
    time: "24h",
    topic: "all",
  },
  
  // Active news source
  activeSource: "guardian",
  
  lastFetched: null,
  guardianLastFetched: null,
};

// Fetch 24hrs bulletin (bullets only)
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

// Expand bulletin into detailed cards
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

// Async thunk for fetching Guardian articles
export const fetchGuardianArticles = createAsyncThunk(
  'news/fetchGuardian',
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        time: filters.time || '24h',
        topic: filters.topic || 'all'
      });
      
      const response = await fetch(`/api/guardian?${params.toString()}`);
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
    clearNews: (state) => {
      state.articles = [];
      state.guardianArticles = [];
      state.combinedArticles = [];
      state.error = null;
      state.guardianError = null;
      state.lastFetched = null;
      state.guardianLastFetched = null;
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
    
    // Guardian reducers
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
      })
      .addCase(fetchGuardianArticles.rejected, (state, action) => {
        state.guardianLoading = false;
        state.guardianError = action.payload?.message || 'Failed to fetch Guardian articles';
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
        state.bulletin.lastFetched = new Date().toISOString();
        state.bulletin.cachedAt = action.payload.cachedAt;
        state.bulletin.error = null;
      })
      .addCase(fetch24hrsBulletin.rejected, (state, action) => {
        state.bulletin.loading = false;
        state.bulletin.error = action.payload?.message || 'Failed to fetch bulletin';
      });
    
    // Bulletin detail expansion reducers
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
  clearNews,
  clearBulletin,
} = newsSlice.actions;

export default newsSlice.reducer;
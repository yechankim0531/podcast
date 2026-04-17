# Data Flow & Storage Explanation

## Current Data Flow (How It Works Now)

### 1. Home Screen → Podcast Detail → Episode Detail

```
Home Screen (index.tsx)
    ↓
Fetches RSS feed directly from internet
    ↓
Stores in React state (useState) - TEMPORARY, NOT SAVED
    ↓
User clicks podcast → Navigate to Podcast Detail
    ↓
Podcast Detail (podcast-detail.tsx)
    ↓
Fetches RSS feed AGAIN (fresh fetch)
    ↓
Stores in React state - TEMPORARY
    ↓
User clicks episode → Navigate to Episode Detail
    ↓
Episode Detail (episode-detail.tsx)
    ↓
Gets data from URL parameters (passed from Podcast Detail)
    ↓
NO RSS fetch - just displays what was passed
```

### 2. Where Data is Currently Stored

**❌ NOT saved locally or in database**

Data is stored in:
- **React State** (`useState`) - Only exists while component is mounted
- **URL Parameters** - Episode data passed via navigation params
- **Memory only** - Lost when app closes or component unmounts

### 3. Current Data Flow Diagram

```
┌─────────────────┐
│  Home Screen    │
│  (index.tsx)    │
└────────┬────────┘
         │
         │ usePodcastRSS(RSS_URL)
         │ ↓
         │ Fetches RSS from internet
         │ ↓
         │ Stores in useState (temporary)
         │
         ▼
┌─────────────────┐
│ Podcast Detail  │
│ (podcast-detail)│
└────────┬────────┘
         │
         │ usePodcastRSS(RSS_URL) - FETCHES AGAIN
         │ ↓
         │ Stores in useState (temporary)
         │
         │ User clicks episode
         │ ↓
         │ Passes data via router.push(params)
         │
         ▼
┌─────────────────┐
│ Episode Detail  │
│ (episode-detail)│
└─────────────────┘
         │
         │ Gets data from URL params
         │ ↓
         │ NO RSS fetch - just displays
```

## Problems with Current Approach

### 1. **No Persistence**
- Data is lost when app closes
- Must re-fetch RSS every time user opens app
- Slow loading times

### 2. **Redundant Fetching**
- Home screen fetches RSS
- Podcast detail fetches RSS AGAIN (same data!)
- Wastes bandwidth and time

### 3. **No Caching**
- Every navigation = new RSS fetch
- No offline support
- Can't work without internet

### 4. **Scaling Issues**
- Can't handle thousands of podcasts
- Would need to fetch all RSS feeds on home screen
- Very slow and inefficient

## How Episode Detail Gets Metadata

Currently, episode detail gets data in **two ways**:

### Method 1: URL Parameters (Current Implementation)
```typescript
// In podcast-detail.tsx
router.push({
  pathname: '/episode-detail',
  params: {
    episodeTitle: encodeURIComponent(ep.title),
    episodeDescription: encodeURIComponent(ep.description),
    // ... all episode data passed via URL
  }
});

// In episode-detail.tsx
const params = useLocalSearchParams();
// Gets data from URL parameters
```

**Pros:**
- Simple, no additional fetch needed
- Fast navigation

**Cons:**
- URL length limits (can't pass huge data)
- Data lost if user refreshes
- Not persistent

### Method 2: Re-fetch from RSS (Alternative)
```typescript
// Could also fetch RSS again in episode-detail
const { data } = usePodcastRSS(rssUrl);
const episode = data.episodes.find(e => e.id === episodeId);
```

**Pros:**
- Always fresh data
- No URL length limits

**Cons:**
- Slower (network request)
- Wastes bandwidth
- Requires internet

## Scaling to Thousands of Podcasts

### Current Approach (Won't Work)
```
Home Screen
    ↓
Fetch RSS for ALL podcasts? ❌
    ↓
Display thousands of cards? ❌
    ↓
Too slow, too much data!
```

### Solution: Backend + Database + Caching

```
┌─────────────┐
│   Backend   │
│   Server    │
└──────┬──────┘
       │
       ├─ Fetches RSS feeds (scheduled)
       ├─ Parses and stores in Database
       ├─ Caches data
       └─ Serves via API
            │
            ▼
┌─────────────┐
│  Database   │
│ (PostgreSQL)│
└─────────────┘
       │
       ├─ Podcasts table
       ├─ Episodes table
       ├─ Users table
       └─ Subscriptions table
            │
            ▼
┌─────────────┐
│  Frontend   │
│  (Your App) │
└─────────────┘
       │
       ├─ Calls API (not RSS directly)
       ├─ Gets paginated results
       ├─ Caches locally (AsyncStorage)
       └─ Displays podcasts
```

## Recommended Architecture for Scaling

### 1. Backend Structure

```
backend/
├── src/
│   ├── services/
│   │   └── rss-parser.ts      ← Copy from frontend!
│   ├── controllers/
│   │   └── podcast.controller.ts
│   ├── models/
│   │   ├── podcast.model.ts
│   │   └── episode.model.ts
│   └── routes/
│       └── podcast.routes.ts
└── database/
    └── schema.sql
```

### 2. Database Schema

```sql
-- Podcasts table
CREATE TABLE podcasts (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(255),
  rss_url VARCHAR(500) UNIQUE,
  image_url VARCHAR(500),
  description TEXT,
  last_updated TIMESTAMP,
  created_at TIMESTAMP
);

-- Episodes table
CREATE TABLE episodes (
  id UUID PRIMARY KEY,
  podcast_id UUID REFERENCES podcasts(id),
  title VARCHAR(255),
  description TEXT,
  audio_url VARCHAR(500),
  publish_date TIMESTAMP,
  duration VARCHAR(50),
  thumbnail VARCHAR(500),
  guid VARCHAR(255) UNIQUE,
  created_at TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_podcasts_updated ON podcasts(last_updated);
CREATE INDEX idx_episodes_podcast ON episodes(podcast_id);
```

### 3. Backend API Endpoints

```typescript
// GET /api/podcasts
// Returns: Paginated list of podcasts
{
  podcasts: [...],
  total: 10000,
  page: 1,
  limit: 20
}

// GET /api/podcasts/:id
// Returns: Single podcast with episodes

// GET /api/podcasts/:id/episodes
// Returns: Episodes for a podcast

// POST /api/podcasts/refresh/:id
// Triggers RSS refresh for a podcast
```

### 4. Frontend Changes

```typescript
// Instead of usePodcastRSS (direct RSS)
// Use usePodcastAPI (backend API)

// hooks/use-podcast-api.ts
export function usePodcastAPI(podcastId: string) {
  // Calls backend API instead of RSS
  const response = await fetch(`${API_URL}/podcasts/${podcastId}`);
  return response.json();
}

// Home screen
const { data } = usePodcastsAPI({ page: 1, limit: 20 });
// Gets paginated results from backend
```

### 5. Caching Strategy

**Backend:**
- Cache RSS feeds (refresh every 1-6 hours)
- Store in database
- Serve from database (fast!)

**Frontend:**
- Cache API responses in AsyncStorage
- Refresh when needed
- Show cached data while fetching

## Migration Path

### Phase 1: Current (MVP) ✅
- Frontend fetches RSS directly
- No persistence
- Works for 1-10 podcasts

### Phase 2: Add Local Caching
- Use AsyncStorage to cache RSS data
- Store podcasts/episodes locally
- Faster, works offline

### Phase 3: Add Backend
- Backend fetches and stores RSS
- Frontend calls API
- Database stores all data
- Handles thousands of podcasts

### Phase 4: Full Scale
- Pagination
- Search
- User subscriptions
- Recommendations
- Analytics

## Summary

**Current State:**
- ❌ No local storage
- ❌ No database
- ❌ Fetches RSS every time
- ❌ Won't scale to thousands

**For Scaling:**
- ✅ Backend with database
- ✅ API endpoints
- ✅ Caching (backend + frontend)
- ✅ Pagination
- ✅ Search capabilities

Your current code is perfect for MVP, but you'll need backend infrastructure for production scale!

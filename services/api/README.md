# Backend API Integration

## Current State: Frontend-Only (MVP)

Right now, your app fetches RSS feeds directly from the frontend using `services/rss-parser.ts`.

## Adding Backend: Step-by-Step

### Step 1: Set Up Backend Server

Create a separate backend project (Node.js/Express, Python/Flask, etc.)

### Step 2: Copy RSS Parser to Backend

Your `services/rss-parser.ts` is **backend-compatible**! Copy it to your backend:

```
backend/
└── src/
    └── services/
        └── rss-parser.ts  ← Copy from frontend
```

### Step 3: Create Backend API Endpoints

Example (Node.js/Express):

```typescript
// backend/src/routes/podcast.routes.ts
import { parseRSSFeed } from '../services/rss-parser';

app.get('/api/podcasts/:rssUrl', async (req, res) => {
  try {
    const podcastData = await parseRSSFeed(req.params.rssUrl);
    // Optionally cache in database
    res.json(podcastData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 4: Update Frontend to Use API

Modify `hooks/use-podcast-rss.ts`:

```typescript
import { fetchPodcastFromAPI } from '@/services/api/podcast-api';
import { parseRSSFeed } from '@/services/rss-parser';

export function usePodcastRSS(rssUrl: string | null, useBackend: boolean = false) {
  // If backend available, use API
  if (useBackend) {
    return usePodcastFromAPI(rssUrl);
  }
  // Otherwise, use direct RSS (current)
  return usePodcastFromRSS(rssUrl);
}
```

### Step 5: Environment Configuration

Create `.env` file:

```
EXPO_PUBLIC_API_URL=https://your-backend.com/api
```

## Benefits of Backend

1. **Caching** - RSS feeds cached in database
2. **Performance** - Faster responses
3. **User Data** - Store subscriptions, play history
4. **Search** - Full-text search across podcasts
5. **Offline** - Pre-downloaded content
6. **Analytics** - Track user behavior

## Migration Path

1. ✅ **Now**: Frontend fetches RSS directly (works great!)
2. 🔄 **Next**: Add backend, frontend can use either RSS or API
3. 🚀 **Future**: Full backend integration, RSS only on backend

import { Router, Request, Response } from 'express';
import { parseRSSFeed, ParsedPodcastData } from '../services/rss-parser';
import {
  searchPodcasts,
  getTrendingPodcasts,
  getRecommendedPodcasts,
  getAllPodcasts,
  PodcastResult,
} from '../services/itunes';
import { TTLCache } from '../cache';

const router = Router();

// Cache RSS feeds for 30 minutes, iTunes results for 10 minutes
const rssCache = new TTLCache<ParsedPodcastData>(30 * 60 * 1000);
const itunesCache = new TTLCache<PodcastResult[]>(10 * 60 * 1000);

// GET /api/podcast?url=<rssUrl>
router.get('/podcast', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: 'Missing required query param: url' });
    return;
  }

  try {
    const cached = rssCache.get(url);
    if (cached) {
      res.json(cached);
      return;
    }

    const data = await parseRSSFeed(url);
    rssCache.set(url, data);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch podcast';
    res.status(500).json({ error: message });
  }
});

// GET /api/podcasts/search?q=<query>
router.get('/podcasts/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: 'Missing required query param: q' });
    return;
  }

  try {
    const cacheKey = `search:${q}`;
    const cached = itunesCache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const results = await searchPodcasts(q);
    itunesCache.set(cacheKey, results);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    res.status(500).json({ error: message });
  }
});

// GET /api/podcasts/trending
router.get('/podcasts/trending', async (_req: Request, res: Response) => {
  try {
    const cached = itunesCache.get('trending');
    if (cached) {
      res.json(cached);
      return;
    }

    const results = await getTrendingPodcasts();
    itunesCache.set('trending', results);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trending';
    res.status(500).json({ error: message });
  }
});

// GET /api/podcasts/recommended
router.get('/podcasts/recommended', async (_req: Request, res: Response) => {
  try {
    const cached = itunesCache.get('recommended');
    if (cached) {
      res.json(cached);
      return;
    }

    const results = await getRecommendedPodcasts();
    itunesCache.set('recommended', results);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch recommendations';
    res.status(500).json({ error: message });
  }
});

// GET /api/podcasts
router.get('/podcasts', async (_req: Request, res: Response) => {
  try {
    const cached = itunesCache.get('all');
    if (cached) {
      res.json(cached);
      return;
    }

    const results = await getAllPodcasts();
    itunesCache.set('all', results);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch podcasts';
    res.status(500).json({ error: message });
  }
});

export default router;

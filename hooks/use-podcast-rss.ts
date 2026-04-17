/**
 * React Hook for fetching and parsing RSS feeds
 * 
 * This hook wraps the RSS parser service for React components.
 * It handles loading states, errors, and React-specific concerns.
 * 
 * NOTE: This is React-only and cannot be used in the backend.
 * The underlying service (rss-parser.ts) is backend-compatible.
 */

import { useState, useEffect } from 'react';
import { parseRSSFeed, isValidRSSUrl } from '@/services/rss-parser';
import type { ParsedPodcastData } from '@/types/podcast';

interface UsePodcastRSSResult {
  data: ParsedPodcastData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and parse podcast RSS feed
 * 
 * @param rssUrl - The RSS feed URL to parse
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * 
 * @example
 * ```typescript
 * const { data, loading, error } = usePodcastRSS('https://feeds.example.com/podcast.xml');
 * 
 * if (loading) return <Text>Loading...</Text>;
 * if (error) return <Text>Error: {error}</Text>;
 * if (data) {
 *   return <Text>{data.metadata.title}</Text>;
 * }
 * ```
 */
export function usePodcastRSS(rssUrl: string | null, autoFetch: boolean = true): UsePodcastRSSResult {
  const [data, setData] = useState<ParsedPodcastData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPodcast = async () => {
    if (!rssUrl) {
      setError('RSS URL is required');
      return;
    }

    if (!isValidRSSUrl(rssUrl)) {
      setError('Invalid RSS URL format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const podcastData = await parseRSSFeed(rssUrl);
      setData(podcastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch podcast');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && rssUrl) {
      fetchPodcast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rssUrl, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchPodcast,
  };
}

/**
 * Podcast API Service
 *
 * This service handles communication with the iTunes Search API for podcasts.
 * Uses the public iTunes API which doesn't require authentication.
 */

import type { Episode, ParsedPodcastData, PodcastMetadata } from '@/types/podcast';

const ITUNES_API_BASE = 'https://itunes.apple.com';

/**
 * Converts iTunes API result to PodcastMetadata
 */
function itunesResultToPodcastMetadata(result: any): PodcastMetadata {
  return {
    title: result.collectionName || result.trackName || 'Unknown Podcast',
    description: result.description || 'No description available',
    author: result.artistName || 'Unknown Author',
    imageUrl: result.artworkUrl600 || result.artworkUrl100,
    websiteUrl: result.collectionViewUrl,
    rssFeedUrl: result.feedUrl || result.collectionViewUrl || '',
    language: 'en',
    category: result.primaryGenreName || 'Podcast',
  };
}

/**
 * Fetches podcast data from RSS feed (placeholder for now)
 */
export async function fetchPodcastFromAPI(podcastId: string): Promise<ParsedPodcastData> {
  // For now, return mock data since RSS parsing would require additional setup
  throw new Error('RSS parsing not implemented yet');
}

/**
 * Fetches list of all podcasts (returns popular podcasts)
 */
export async function fetchAllPodcasts(): Promise<PodcastMetadata[]> {
  try {
    const response = await fetch(`${ITUNES_API_BASE}/search?term=podcast&entity=podcast&limit=50`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map(itunesResultToPodcastMetadata);
  } catch (error) {
    throw new Error(
      `Failed to fetch podcasts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches episodes for a specific podcast (placeholder)
 */
export async function fetchPodcastEpisodes(podcastId: string): Promise<Episode[]> {
  // For now, return empty array since RSS parsing is not implemented
  return [];
}

/**
 * Searches podcasts by query using iTunes API
 */
export async function searchPodcasts(query: string): Promise<PodcastMetadata[]> {
  try {
    const response = await fetch(`${ITUNES_API_BASE}/search?term=${encodeURIComponent(query)}&entity=podcast&limit=20`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map(itunesResultToPodcastMetadata);
  } catch (error) {
    throw new Error(
      `Failed to search podcasts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches trending podcasts (popular podcasts)
 */
export async function fetchTrendingPodcasts(): Promise<PodcastMetadata[]> {
  try {
    // Use popular search terms to get trending-like results
    const response = await fetch(`${ITUNES_API_BASE}/search?term=news&entity=podcast&limit=20`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map(itunesResultToPodcastMetadata);
  } catch (error) {
    throw new Error(
      `Failed to fetch trending podcasts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches recommended podcasts for a user (returns popular podcasts for now)
 */
export async function fetchRecommendedPodcasts(userId: string): Promise<PodcastMetadata[]> {
  try {
    // For now, return technology podcasts as recommendations
    const response = await fetch(`${ITUNES_API_BASE}/search?term=technology&entity=podcast&limit=15`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map(itunesResultToPodcastMetadata);
  } catch (error) {
    throw new Error(
      `Failed to fetch recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

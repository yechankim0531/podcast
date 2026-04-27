/**
 * TypeScript type definitions for podcast data structures
 * These types are reusable in both frontend and backend
 */

export interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  publishDate: string;
  duration?: string; // In seconds or "HH:MM:SS" format
  thumbnail?: string;
  transcriptUrl?: string;
  transcriptType?: string;
  transcriptLanguage?: string;
  guid?: string; // RSS feed's unique identifier
}

export interface PodcastMetadata {
  title: string;
  description: string;
  author: string;
  imageUrl?: string;
  websiteUrl?: string;
  rssFeedUrl: string;
  language?: string;
  category?: string;
  lastUpdated?: string;
}

export interface ParsedPodcastData {
  metadata: PodcastMetadata;
  episodes: Episode[];
}

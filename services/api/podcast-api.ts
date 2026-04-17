/**
 * Backend API Service
 * 
 * This service handles communication with your backend API.
 * When you add a backend, update the API_BASE_URL and use these functions.
 * 
 * For now, this is a template showing how backend integration would work.
 */

import type { ParsedPodcastData, PodcastMetadata, Episode } from '@/types/podcast';

// TODO: Update this to your actual backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Fetches podcast data from backend API
 * Backend would have already parsed RSS and stored in database
 */
export async function fetchPodcastFromAPI(podcastId: string): Promise<ParsedPodcastData> {
  try {
    const response = await fetch(`${API_BASE_URL}/podcasts/${podcastId}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch podcast from API: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches list of all podcasts from backend
 */
export async function fetchAllPodcasts(): Promise<PodcastMetadata[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/podcasts`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch podcasts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches episodes for a specific podcast
 */
export async function fetchPodcastEpisodes(podcastId: string): Promise<Episode[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/podcasts/${podcastId}/episodes`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch episodes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Subscribes user to a podcast (backend stores subscription)
 */
export async function subscribeToPodcast(podcastId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ podcastId }),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

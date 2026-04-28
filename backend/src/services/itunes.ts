const ITUNES_BASE = 'https://itunes.apple.com';

export interface PodcastResult {
  title: string;
  description: string;
  author: string;
  imageUrl?: string;
  websiteUrl?: string;
  rssFeedUrl: string;
  language: string;
  category: string;
}

function mapResult(r: any): PodcastResult {
  return {
    title: r.collectionName || r.trackName || 'Unknown Podcast',
    description: r.description || 'No description available',
    author: r.artistName || 'Unknown Author',
    imageUrl: r.artworkUrl600 || r.artworkUrl100,
    websiteUrl: r.collectionViewUrl,
    rssFeedUrl: r.feedUrl || r.collectionViewUrl || '',
    language: 'en',
    category: r.primaryGenreName || 'Podcast',
  };
}

async function itunesSearch(term: string, limit: number): Promise<PodcastResult[]> {
  const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(term)}&entity=podcast&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`iTunes API error: ${response.status}`);
  const data = await response.json() as { results: any[] };
  return data.results.map(mapResult).filter(p => p.rssFeedUrl);
}

export async function searchPodcasts(query: string): Promise<PodcastResult[]> {
  return itunesSearch(query, 20);
}

export async function getTrendingPodcasts(): Promise<PodcastResult[]> {
  return itunesSearch('news', 20);
}

export async function getRecommendedPodcasts(): Promise<PodcastResult[]> {
  return itunesSearch('technology', 15);
}

export async function getAllPodcasts(): Promise<PodcastResult[]> {
  return itunesSearch('podcast', 50);
}

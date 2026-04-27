import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface LikedPodcast {
  title: string;
  author: string;
  imageUrl?: string;
  rssUrl: string;
  likedAt: string;
}

interface LikedPodcastsContextValue {
  likedPodcasts: LikedPodcast[];
  isPodcastLiked: (rssUrl: string | null | undefined) => boolean;
  toggleLikedPodcast: (podcast: Omit<LikedPodcast, 'likedAt'>) => Promise<void>;
}

const LikedPodcastsContext = createContext<LikedPodcastsContextValue | null>(null);
const LIKED_PODCASTS_KEY = 'likedPodcasts';

export function LikedPodcastsProvider({ children }: { children: ReactNode }) {
  const [likedPodcasts, setLikedPodcasts] = useState<LikedPodcast[]>([]);

  useEffect(() => {
    const loadLikedPodcasts = async () => {
      try {
        const likedJson = await AsyncStorage.getItem(LIKED_PODCASTS_KEY);
        if (likedJson) {
          setLikedPodcasts(JSON.parse(likedJson) as LikedPodcast[]);
        }
      } catch (error) {
        console.error('Failed to load liked podcasts:', error);
      }
    };

    loadLikedPodcasts();
  }, []);

  const persistLikedPodcasts = useCallback(async (podcasts: LikedPodcast[]) => {
    try {
      await AsyncStorage.setItem(LIKED_PODCASTS_KEY, JSON.stringify(podcasts));
    } catch (error) {
      console.error('Failed to save liked podcasts:', error);
    }
  }, []);

  const isPodcastLiked = useCallback(
    (rssUrl: string | null | undefined) => Boolean(rssUrl && likedPodcasts.some((podcast) => podcast.rssUrl === rssUrl)),
    [likedPodcasts]
  );

  const toggleLikedPodcast = useCallback(
    async (podcast: Omit<LikedPodcast, 'likedAt'>) => {
      setLikedPodcasts((prev) => {
        const alreadyLiked = prev.some((item) => item.rssUrl === podcast.rssUrl);
        const updated = alreadyLiked
          ? prev.filter((item) => item.rssUrl !== podcast.rssUrl)
          : [{ ...podcast, likedAt: new Date().toISOString() }, ...prev];

        persistLikedPodcasts(updated);
        return updated;
      });
    },
    [persistLikedPodcasts]
  );

  const value = useMemo(
    () => ({
      likedPodcasts,
      isPodcastLiked,
      toggleLikedPodcast,
    }),
    [isPodcastLiked, likedPodcasts, toggleLikedPodcast]
  );

  return <LikedPodcastsContext.Provider value={value}>{children}</LikedPodcastsContext.Provider>;
}

export function useLikedPodcasts() {
  const context = useContext(LikedPodcastsContext);
  if (!context) {
    throw new Error('useLikedPodcasts must be used within LikedPodcastsProvider');
  }

  return context;
}

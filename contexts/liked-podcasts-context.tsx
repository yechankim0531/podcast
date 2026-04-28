import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { auth, db } from '@/lib/firebase';

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

// Encode rssUrl to a safe Firestore document ID (no forward slashes)
function toDocId(rssUrl: string): string {
  return encodeURIComponent(rssUrl);
}

export function LikedPodcastsProvider({ children }: { children: ReactNode }) {
  const [likedPodcasts, setLikedPodcasts] = useState<LikedPodcast[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const firestoreUnsub = useRef<(() => void) | null>(null);

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Subscribe to liked podcasts — Firestore when logged in, AsyncStorage when not
  useEffect(() => {
    firestoreUnsub.current?.();
    firestoreUnsub.current = null;

    if (!currentUser) {
      AsyncStorage.getItem(LIKED_PODCASTS_KEY)
        .then((json) => setLikedPodcasts(json ? (JSON.parse(json) as LikedPodcast[]) : []))
        .catch(() => setLikedPodcasts([]));
      return;
    }

    const likedRef = collection(db, 'users', currentUser.uid, 'likedPodcasts');
    const unsub = onSnapshot(likedRef, (snapshot) => {
      const podcasts: LikedPodcast[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          title: data.title as string,
          author: data.author as string,
          imageUrl: data.imageUrl as string | undefined,
          rssUrl: data.rssUrl as string,
          likedAt:
            data.likedAt instanceof Timestamp
              ? data.likedAt.toDate().toISOString()
              : (data.likedAt as string),
        };
      });
      podcasts.sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
      setLikedPodcasts(podcasts);
    });

    firestoreUnsub.current = unsub;
    return () => unsub();
  }, [currentUser]);

  const isPodcastLiked = useCallback(
    (rssUrl: string | null | undefined) =>
      Boolean(rssUrl && likedPodcasts.some((p) => p.rssUrl === rssUrl)),
    [likedPodcasts]
  );

  const toggleLikedPodcast = useCallback(
    async (podcast: Omit<LikedPodcast, 'likedAt'>) => {
      if (!currentUser) {
        // Local-only fallback for unauthenticated users
        setLikedPodcasts((prev) => {
          const alreadyLiked = prev.some((item) => item.rssUrl === podcast.rssUrl);
          const updated = alreadyLiked
            ? prev.filter((item) => item.rssUrl !== podcast.rssUrl)
            : [{ ...podcast, likedAt: new Date().toISOString() }, ...prev];
          AsyncStorage.setItem(LIKED_PODCASTS_KEY, JSON.stringify(updated)).catch(console.error);
          return updated;
        });
        return;
      }

      const docRef = doc(db, 'users', currentUser.uid, 'likedPodcasts', toDocId(podcast.rssUrl));
      const alreadyLiked = likedPodcasts.some((p) => p.rssUrl === podcast.rssUrl);

      if (alreadyLiked) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          ...podcast,
          likedAt: Timestamp.now(),
        });
      }
      // State updates automatically via onSnapshot
    },
    [currentUser, likedPodcasts]
  );

  const value = useMemo(
    () => ({ likedPodcasts, isPodcastLiked, toggleLikedPodcast }),
    [likedPodcasts, isPodcastLiked, toggleLikedPodcast]
  );

  return <LikedPodcastsContext.Provider value={value}>{children}</LikedPodcastsContext.Provider>;
}

export function useLikedPodcasts() {
  const context = useContext(LikedPodcastsContext);
  if (!context) throw new Error('useLikedPodcasts must be used within LikedPodcastsProvider');
  return context;
}

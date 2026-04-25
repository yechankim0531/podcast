import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface AudioTrack {
  episodeTitle: string;
  episodeAudioUrl: string;
  episodeThumbnail?: string;
  podcastTitle: string;
  podcastAuthor?: string;
  podcastRssUrl: string;
  podcastImageUrl?: string;
}

interface ListeningHistoryItem {
  podcastTitle: string;
  podcastAuthor?: string;
  podcastImageUrl?: string;
  podcastRssUrl: string;
  lastListenedAt: string;
}

interface AudioPlayerContextValue {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  error: string | null;
  hasTrackLoaded: boolean;
  listeningHistory: ListeningHistoryItem[];
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  loadAudio: (uri: string) => Promise<void>;
  playTrack: (track: AudioTrack) => Promise<void>;
  addToHistory: (track: AudioTrack) => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [listeningHistory, setListeningHistory] = useState<ListeningHistoryItem[]>([]);

  const clearPlaybackState = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setDuration(0);
    setPosition(0);
  }, []);

  const loadListeningHistory = useCallback(async () => {
    try {
      const historyJson = await AsyncStorage.getItem('listeningHistory');
      if (historyJson) {
        const history = JSON.parse(historyJson) as ListeningHistoryItem[];
        setListeningHistory(history);
      }
    } catch (error) {
      console.error('Failed to load listening history:', error);
    }
  }, []);

  const saveListeningHistory = useCallback(async (history: ListeningHistoryItem[]) => {
    try {
      await AsyncStorage.setItem('listeningHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save listening history:', error);
    }
  }, []);

  const addToHistory = useCallback(async (track: AudioTrack) => {
    const historyItem: ListeningHistoryItem = {
      podcastTitle: track.podcastTitle,
      podcastAuthor: track.podcastAuthor,
      podcastImageUrl: track.podcastImageUrl,
      podcastRssUrl: track.podcastRssUrl,
      lastListenedAt: new Date().toISOString(),
    };

    setListeningHistory(prev => {
      // Remove existing entry for this podcast if it exists
      const filtered = prev.filter(item => item.podcastRssUrl !== track.podcastRssUrl);
      // Add new entry at the beginning
      const updated = [historyItem, ...filtered];
      // Keep only the most recent 50 items
      const limited = updated.slice(0, 50);
      saveListeningHistory(limited);
      return limited;
    });
  }, [saveListeningHistory]);

  const handleStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) {
      return;
    }

    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
    setIsPlaying(status.isPlaying);
    setIsPaused(!status.isPlaying && (status.positionMillis ?? 0) > 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setIsPaused(false);
      setPosition(0);
    }
  }, []);

  const unloadCurrentSound = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    const soundToUnload = soundRef.current;
    soundRef.current = null;
    await soundToUnload.unloadAsync();
  }, []);

  const loadAudio = useCallback(
    async (uri: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await unloadCurrentSound();
        clearPlaybackState();

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 },
          handleStatusUpdate
        );

        soundRef.current = newSound;
        const status = await newSound.getStatusAsync();
        if (status.isLoaded) {
          setDuration(status.durationMillis ?? 0);
          setPosition(status.positionMillis ?? 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    },
    [clearPlaybackState, handleStatusUpdate, unloadCurrentSound]
  );

  const play = useCallback(async () => {
    try {
      if (!soundRef.current) {
        throw new Error('No audio loaded');
      }

      await soundRef.current.playAsync();
      setIsPlaying(true);
      setIsPaused(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play audio');
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (!soundRef.current) {
        return;
      }

      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      setIsPaused(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause audio');
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
      return;
    }

    await play();
  }, [isPlaying, pause, play]);

  const skipForward = useCallback(
    async (seconds: number = 15) => {
      try {
        if (!soundRef.current) {
          return;
        }

        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) {
          return;
        }

        const currentPosition = status.positionMillis ?? 0;
        const maxDuration = status.durationMillis ?? duration;
        const newPosition = Math.min(currentPosition + seconds * 1000, maxDuration || Infinity);
        await soundRef.current.setPositionAsync(newPosition);
        setPosition(newPosition);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to skip forward');
      }
    },
    [duration]
  );

  const skipBackward = useCallback(async (seconds: number = 15) => {
    try {
      if (!soundRef.current) {
        return;
      }

      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }

      const currentPosition = status.positionMillis ?? 0;
      const newPosition = Math.max(currentPosition - seconds * 1000, 0);
      await soundRef.current.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip backward');
    }
  }, []);

  const seek = useCallback(async (positionMillis: number) => {
    try {
      if (!soundRef.current) {
        return;
      }

      await soundRef.current.setPositionAsync(positionMillis);
      setPosition(positionMillis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seek');
    }
  }, []);

  const playTrack = useCallback(
    async (track: AudioTrack) => {
      setCurrentTrack(track);
      await loadAudio(track.episodeAudioUrl);
      await play();
      await addToHistory(track);
    },
    [loadAudio, play, addToHistory]
  );

  useEffect(() => {
    loadListeningHistory();
  }, [loadListeningHistory]);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      currentTrack,
      isPlaying,
      isPaused,
      isLoading,
      duration,
      position,
      error,
      hasTrackLoaded: Boolean(currentTrack && soundRef.current),
      listeningHistory,
      play,
      pause,
      togglePlayPause,
      skipForward,
      skipBackward,
      seek,
      loadAudio,
      playTrack,
      addToHistory,
    }),
    [
      currentTrack,
      duration,
      error,
      isLoading,
      isPaused,
      isPlaying,
      listeningHistory,
      loadAudio,
      play,
      playTrack,
      position,
      seek,
      skipBackward,
      skipForward,
      togglePlayPause,
      addToHistory,
    ]
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }

  return context;
}

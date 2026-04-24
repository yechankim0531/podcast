import { Audio } from 'expo-av';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface AudioTrack {
  episodeTitle: string;
  episodeAudioUrl: string;
  episodeThumbnail?: string;
  podcastTitle: string;
  podcastAuthor?: string;
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
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  loadAudio: (uri: string) => Promise<void>;
  playTrack: (track: AudioTrack) => Promise<void>;
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

  const clearPlaybackState = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setDuration(0);
    setPosition(0);
  }, []);

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
    },
    [loadAudio, play]
  );

  useEffect(() => {
    return () => {
      void unloadCurrentSound();
    };
  }, [unloadCurrentSound]);

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
      play,
      pause,
      togglePlayPause,
      skipForward,
      skipBackward,
      seek,
      loadAudio,
      playTrack,
    }),
    [
      currentTrack,
      duration,
      error,
      isLoading,
      isPaused,
      isPlaying,
      loadAudio,
      pause,
      play,
      playTrack,
      position,
      seek,
      skipBackward,
      skipForward,
      togglePlayPause,
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

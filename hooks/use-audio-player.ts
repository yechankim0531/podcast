/**
 * React Hook for audio playback
 * 
 * Manages audio playback state and controls using expo-av
 */

import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

interface UseAudioPlayerResult {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  duration: number; // in milliseconds
  position: number; // in milliseconds
  error: string | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  loadAudio: (uri: string) => Promise<void>;
}

export function useAudioPlayer(): UseAudioPlayerResult {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const positionUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update position periodically when playing
  useEffect(() => {
    if (isPlaying && sound) {
      positionUpdateInterval.current = setInterval(async () => {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
          }
        } catch (err) {
          console.error('Error updating position:', err);
        }
      }, 100); // Update every 100ms
    } else {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }
    }

    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [isPlaying, sound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [sound]);

  const loadAudio = async (uri: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setIsPaused(false);
              setPosition(0);
            }
          }
        }
      );

      setSound(newSound);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio');
      setIsLoading(false);
    }
  };

  const play = async () => {
    try {
      if (!sound) {
        throw new Error('No audio loaded');
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        throw new Error('Audio not loaded');
      }

      await sound.playAsync();
      setIsPlaying(true);
      setIsPaused(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play audio');
      setIsPlaying(false);
    }
  };

  const pause = async () => {
    try {
      if (!sound) {
        return;
      }

      await sound.pauseAsync();
      setIsPlaying(false);
      setIsPaused(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause audio');
    }
  };

  const skipForward = async (seconds: number = 15) => {
    try {
      if (!sound) {
        return;
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }

      const currentPosition = status.positionMillis || 0;
      const newPosition = Math.min(currentPosition + seconds * 1000, duration || Infinity);
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip forward');
    }
  };

  const skipBackward = async (seconds: number = 15) => {
    try {
      if (!sound) {
        return;
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }

      const currentPosition = status.positionMillis || 0;
      const newPosition = Math.max(currentPosition - seconds * 1000, 0);
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip backward');
    }
  };

  const seek = async (positionMillis: number) => {
    try {
      if (!sound) {
        return;
      }

      await sound.setPositionAsync(positionMillis);
      setPosition(positionMillis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seek');
    }
  };

  return {
    isPlaying,
    isPaused,
    isLoading,
    duration,
    position,
    error,
    play,
    pause,
    skipForward,
    skipBackward,
    seek,
    loadAudio,
  };
}

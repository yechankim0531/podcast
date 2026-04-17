# Audio Player Code Explanation

## 📁 File 1: `hooks/use-audio-player.ts`

This is a **React Hook** that manages all audio playback logic. Think of it as the "brain" of the audio player.

---

### **Lines 1-8: Imports**

```typescript
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
```

- **`useState`**: React hook to store data that changes (like isPlaying, position, etc.)
- **`useEffect`**: React hook to run code when something changes (like updating position)
- **`useRef`**: React hook to store values that don't trigger re-renders (like our interval timer)
- **`Audio`**: The expo-av library that handles actual audio playback

---

### **Lines 10-22: TypeScript Interface**

```typescript
interface UseAudioPlayerResult {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  duration: number; // in milliseconds
  position: number; // in milliseconds
  error: string | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  loadAudio: (uri: string) => Promise<void>;
}
```

**What this does:** Defines what the hook will return. It's like a contract saying "this hook will give you these things."

- **`isPlaying`**: Is audio currently playing? (true/false)
- **`isPaused`**: Is audio paused? (true/false)
- **`isLoading`**: Is audio loading? (true/false)
- **`duration`**: Total length of audio in milliseconds
- **`position`**: Current playback position in milliseconds
- **`error`**: Any error message (or null if no error)
- **`play()`**: Function to start playing
- **`pause()`**: Function to pause
- **`stop()`**: Function to stop and reset
- **`seek()`**: Function to jump to a specific time
- **`loadAudio()`**: Function to load audio from a URL

---

### **Lines 24-32: State Variables**

```typescript
export function useAudioPlayer(): UseAudioPlayerResult {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const positionUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
```

**What this does:** Creates all the state variables the hook needs.

- **`sound`**: The actual audio object from expo-av (null until loaded)
- **`isPlaying`**: Starts as `false` (not playing)
- **`isPaused`**: Starts as `false` (not paused)
- **`isLoading`**: Starts as `false` (not loading)
- **`duration`**: Starts at `0` (we don't know duration yet)
- **`position`**: Starts at `0` (at the beginning)
- **`error`**: Starts as `null` (no errors)
- **`positionUpdateInterval`**: Stores the timer that updates position (starts as null)

---

### **Lines 34-60: Position Update Effect**

```typescript
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
```

**What this does:** Updates the playback position every 100 milliseconds while playing.

**Line-by-line:**
- **Line 35**: `if (isPlaying && sound)` - Only run if audio is playing AND sound is loaded
- **Line 36**: `setInterval(...)` - Create a timer that runs repeatedly
- **Line 37**: `async () => {...}` - Async function (needed because we're waiting for audio status)
- **Line 39**: `sound.getStatusAsync()` - Ask expo-av "what's the current status?"
- **Line 40**: `if (status.isLoaded)` - Make sure audio is actually loaded
- **Line 41**: `setPosition(...)` - Update our position state with current position
- **Line 42**: `setDuration(...)` - Update duration (in case it wasn't known before)
- **Line 47**: `}, 100)` - Run this every 100 milliseconds (10 times per second)
- **Lines 48-52**: If NOT playing, stop the timer
- **Lines 55-59**: Cleanup function - stop timer when component unmounts
- **Line 60**: `[isPlaying, sound]` - Re-run this effect when `isPlaying` or `sound` changes

**Why 100ms?** Smooth enough for UI (updates 10x per second), not too frequent (doesn't waste battery).

---

### **Lines 62-72: Cleanup Effect**

```typescript
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
```

**What this does:** Cleans up when component is destroyed or sound changes.

- **Line 64**: `return () => {...}` - This function runs when component unmounts
- **Line 65-67**: If there's a sound loaded, unload it (free memory)
- **Line 68-70**: Stop the position update timer
- **Line 72**: `[sound]` - Re-run cleanup when `sound` changes

**Why needed?** Prevents memory leaks - audio objects take up memory!

---

### **Lines 74-116: loadAudio Function**

```typescript
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
```

**What this does:** Loads audio from a URL (like the RSS feed audio URL).

**Line-by-line:**
- **Line 74**: `async (uri: string)` - Takes a URL string, returns a Promise
- **Line 76**: `setIsLoading(true)` - Show loading spinner
- **Line 77**: `setError(null)` - Clear any previous errors
- **Lines 80-82**: If there's already audio loaded, unload it first
- **Lines 85-89**: Configure how audio behaves:
  - `playsInSilentModeIOS`: Play even if iPhone is on silent
  - `staysActiveInBackground`: Keep playing when app is in background
  - `shouldDuckAndroid`: Lower other audio on Android
- **Lines 92-104**: Create the audio object:
  - `{ uri }`: The audio URL to load
  - `{ shouldPlay: false }`: Don't auto-play, just load
  - `(status) => {...}`: Callback when status changes (like when it finishes)
- **Line 106**: Save the sound object to state
- **Lines 107-110**: Get the duration of the audio
- **Line 111**: Stop loading
- **Lines 112-115**: If error, save error message and stop loading

---

### **Lines 118-137: play Function**

```typescript
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
```

**What this does:** Starts playing the audio.

**Line-by-line:**
- **Line 120-122**: Check if sound exists, if not throw error
- **Line 124-127**: Check if sound is loaded, if not throw error
- **Line 129**: `sound.playAsync()` - Tell expo-av to start playing
- **Line 130**: `setIsPlaying(true)` - Update state to show it's playing
- **Line 131**: `setIsPaused(false)` - Not paused anymore
- **Line 132**: `setError(null)` - Clear errors
- **Lines 133-136**: If error, save error and set playing to false

---

### **Lines 139-151: pause Function**

```typescript
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
```

**What this does:** Pauses the audio.

**Line-by-line:**
- **Line 141-143**: If no sound, just return (do nothing)
- **Line 145**: `sound.pauseAsync()` - Tell expo-av to pause
- **Line 146**: `setIsPlaying(false)` - Not playing anymore
- **Line 147**: `setIsPaused(true)` - Now paused
- **Lines 148-150**: Handle errors

---

### **Lines 153-167: stop Function**

```typescript
const stop = async () => {
  try {
    if (!sound) {
      return;
    }

    await sound.stopAsync();
    await sound.setPositionAsync(0);
    setIsPlaying(false);
    setIsPaused(false);
    setPosition(0);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to stop audio');
  }
};
```

**What this does:** Stops audio and resets to beginning.

**Line-by-line:**
- **Line 155-157**: If no sound, return
- **Line 159**: `sound.stopAsync()` - Stop playback
- **Line 160**: `sound.setPositionAsync(0)` - Jump back to start
- **Line 161**: Not playing
- **Line 162**: Not paused
- **Line 163**: Reset position to 0

---

### **Lines 169-180: seek Function**

```typescript
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
```

**What this does:** Jumps to a specific time in the audio.

**Line-by-line:**
- **Line 169**: Takes position in milliseconds (e.g., 60000 = 1 minute)
- **Line 171-173**: If no sound, return
- **Line 175**: `sound.setPositionAsync(...)` - Jump to that position
- **Line 176**: Update our position state
- **Lines 177-179**: Handle errors

---

### **Lines 182-194: Return Statement**

```typescript
return {
  isPlaying,
  isPaused,
  isLoading,
  duration,
  position,
  error,
  play,
  pause,
  stop,
  seek,
  loadAudio,
};
```

**What this does:** Returns everything the component needs to use the audio player.

This is what components get when they call `useAudioPlayer()`.

---

## 📁 File 2: `app/player.tsx`

This is the **UI screen** that displays the player and uses the hook.

---

### **Lines 1-8: Imports**

```typescript
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAudioPlayer } from '@/hooks/use-audio-player';
```

- **React Native components**: View, StyleSheet, TouchableOpacity, ActivityIndicator
- **Expo Router**: Get URL parameters, navigate back
- **Expo Image**: Display images
- **React**: useEffect hook
- **Our components**: ThemedText, ThemedView
- **Our hook**: The audio player hook we just explained!

---

### **Lines 10-31: Component Setup**

```typescript
export default function PlayerScreen() {
  const params = useLocalSearchParams<{
    episodeTitle: string;
    episodeAudioUrl: string;
    episodeThumbnail?: string;
    podcastTitle: string;
    podcastAuthor: string;
  }>();

  const {
    isPlaying,
    isPaused,
    isLoading,
    duration,
    position,
    error,
    play,
    pause,
    stop,
    seek,
    loadAudio,
  } = useAudioPlayer();
```

**What this does:** Gets data from URL and sets up the audio player.

- **Lines 11-17**: Get parameters from URL (episode data passed from previous screen)
- **Lines 19-31**: Get everything from the audio player hook

---

### **Lines 33-48: Decode Parameters**

```typescript
const decodeParam = (param: string | string[] | undefined): string => {
  if (!param) return '';
  const value = Array.isArray(param) ? param[0] : param;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const episodeTitle = decodeParam(params.episodeTitle);
const episodeAudioUrl = decodeParam(params.episodeAudioUrl);
const episodeThumbnail = params.episodeThumbnail ? decodeParam(params.episodeThumbnail) : undefined;
const podcastTitle = decodeParam(params.podcastTitle);
const podcastAuthor = decodeParam(params.podcastAuthor);
```

**What this does:** Decodes URL-encoded strings (they were encoded when passed via navigation).

- **Line 34**: Helper function to decode a parameter
- **Line 35**: If no param, return empty string
- **Line 36**: If it's an array, take first item (Expo Router quirk)
- **Line 38**: Decode the URL-encoded string
- **Lines 44-48**: Decode all the episode data

---

### **Lines 50-55: Load Audio on Mount**

```typescript
useEffect(() => {
  if (episodeAudioUrl) {
    loadAudio(episodeAudioUrl);
  }
}, [episodeAudioUrl]);
```

**What this does:** Automatically loads audio when screen opens.

- **Line 51**: When component mounts (screen opens)
- **Line 52**: If we have an audio URL
- **Line 53**: Load it using the hook's `loadAudio` function
- **Line 55**: Only run when `episodeAudioUrl` changes

---

### **Lines 57-64: Format Time Function**

```typescript
const formatTime = (millis: number): string => {
  if (!millis || isNaN(millis)) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
```

**What this does:** Converts milliseconds to "MM:SS" format.

- **Line 58**: Takes milliseconds (e.g., 125000)
- **Line 59**: If invalid, return "0:00"
- **Line 60**: Convert to seconds (125000ms = 125 seconds)
- **Line 61**: Get minutes (125 seconds = 2 minutes)
- **Line 62**: Get remaining seconds (125 % 60 = 5 seconds)
- **Line 63**: Return "2:05" (pad seconds with 0 if needed)

**Example:** 125000ms → "2:05"

---

### **Lines 66-67: Calculate Progress**

```typescript
const progress = duration > 0 ? (position / duration) * 100 : 0;
```

**What this does:** Calculates how far through the audio we are (0-100%).

- If duration is 0, progress is 0
- Otherwise: (current position / total duration) × 100
- **Example:** 30 seconds into 60 second audio = 50%

---

### **Lines 69-73: Handle Seek (Placeholder)**

```typescript
const handleSeek = (event: any) => {
  // This is a simplified seek - in production you'd use a proper slider
  // For now, we'll just show the progress
};
```

**What this does:** Placeholder for seek functionality (not implemented yet, just shows progress).

---

### **Lines 75-82: Header**

```typescript
<ThemedView style={styles.container}>
  {/* Header */}
  <ThemedView style={styles.header}>
    <TouchableOpacity onPress={() => router.back()}>
      <ThemedText style={styles.backButton}>← Back</ThemedText>
    </TouchableOpacity>
  </ThemedView>
```

**What this does:** Creates the header with back button.

- **Line 78**: Header container
- **Line 79**: Touchable button
- **Line 80**: When pressed, go back to previous screen
- **Line 81**: Display "← Back" text

---

### **Lines 86-95: Episode Artwork**

```typescript
<ThemedView style={styles.artworkContainer}>
  {episodeThumbnail ? (
    <Image source={{ uri: episodeThumbnail }} style={styles.artwork} contentFit="cover" />
  ) : (
    <ThemedView style={[styles.artwork, styles.artworkPlaceholder]}>
      <ThemedText style={styles.placeholderText}>🎙️</ThemedText>
    </ThemedView>
  )}
</ThemedView>
```

**What this does:** Shows episode image or placeholder.

- **Line 88**: If thumbnail exists, show image
- **Line 89**: Load image from URL
- **Lines 90-93**: If no thumbnail, show emoji placeholder

---

### **Lines 97-108: Episode Info**

```typescript
<ThemedView style={styles.infoContainer}>
  <ThemedText type="title" style={styles.episodeTitle} numberOfLines={2}>
    {episodeTitle}
  </ThemedText>
  <ThemedText type="subtitle" style={styles.podcastTitle} numberOfLines={1}>
    {podcastTitle}
  </ThemedText>
  <ThemedText style={styles.podcastAuthor} numberOfLines={1}>
    {podcastAuthor}
  </ThemedText>
</ThemedView>
```

**What this does:** Displays episode title, podcast name, and author.

- Shows episode title (max 2 lines)
- Shows podcast title (max 1 line)
- Shows author (max 1 line)

---

### **Lines 110-119: Progress Bar**

```typescript
<ThemedView style={styles.progressContainer}>
  <ThemedView style={styles.progressBarBackground}>
    <ThemedView style={[styles.progressBarFill, { width: `${progress}%` }]} />
  </ThemedView>
  <ThemedView style={styles.timeContainer}>
    <ThemedText style={styles.timeText}>{formatTime(position)}</ThemedText>
    <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
  </ThemedView>
</ThemedView>
```

**What this does:** Shows progress bar and time.

- **Line 112**: Background bar (gray)
- **Line 113**: Fill bar (blue) - width is `progress%` (0-100%)
- **Line 116**: Current time (e.g., "1:23")
- **Line 117**: Total time (e.g., "5:45")

---

### **Lines 121-126: Error Display**

```typescript
{error && (
  <ThemedView style={styles.errorContainer}>
    <ThemedText style={styles.errorText}>{error}</ThemedText>
  </ThemedView>
)}
```

**What this does:** Shows error message if something went wrong.

- Only shows if `error` exists
- Displays error text in red

---

### **Lines 128-154: Controls**

```typescript
<ThemedView style={styles.controlsContainer}>
  {/* Stop Button */}
  <TouchableOpacity
    style={styles.controlButton}
    onPress={stop}
    disabled={isLoading || (!isPlaying && !isPaused)}>
    <ThemedText style={styles.controlButtonText}>⏹</ThemedText>
  </TouchableOpacity>

  {/* Play/Pause Button */}
  <TouchableOpacity
    style={[styles.controlButton, styles.playButton]}
    onPress={isPlaying ? pause : play}
    disabled={isLoading}>
    {isLoading ? (
      <ActivityIndicator size="large" color="#FFFFFF" />
    ) : (
      <ThemedText style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</ThemedText>
    )}
  </TouchableOpacity>

  {/* Placeholder for next episode (future feature) */}
  <TouchableOpacity style={styles.controlButton} disabled>
    <ThemedText style={[styles.controlButtonText, styles.disabledButton]}>⏭</ThemedText>
  </TouchableOpacity>
</ThemedView>
```

**What this does:** Creates play/pause/stop buttons.

- **Lines 131-136**: Stop button
  - Calls `stop()` when pressed
  - Disabled if loading or not playing/paused
- **Lines 138-148**: Play/Pause button (big, blue)
  - If playing, shows pause icon and calls `pause()`
  - If not playing, shows play icon and calls `play()`
  - Shows loading spinner while loading
- **Lines 150-153**: Next button (disabled, future feature)

---

### **Lines 160-284: Styles**

All the CSS-like styling for the components. Defines colors, sizes, spacing, etc.

---

## 🔄 How It All Works Together

1. **User clicks "Play Episode"** → Navigates to player screen with episode data
2. **Player screen opens** → `useEffect` runs → calls `loadAudio(episodeAudioUrl)`
3. **`loadAudio` function** → Fetches audio from RSS URL → Creates audio object
4. **User clicks play button** → Calls `play()` → Audio starts playing
5. **Position updates** → Every 100ms, `useEffect` updates `position` state
6. **UI updates** → Progress bar and time display update automatically
7. **User clicks pause** → Calls `pause()` → Audio pauses
8. **User clicks stop** → Calls `stop()` → Audio stops and resets

The hook manages all the audio logic, the screen just displays it and handles user interactions!

import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAudioPlayer } from '@/hooks/use-audio-player';

export default function PlayerScreen() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    duration,
    position,
    error,
    play,
    pause,
    skipForward,
    skipBackward,
    seek,
  } = useAudioPlayer();



  // Local state for slider (to allow dragging without constant updates)
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update slider value when position changes (but not while dragging)
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const newValue = (position / duration) * 100;
      setSliderValue(isNaN(newValue) ? 0 : newValue);
    }
  }, [position, duration, isDragging]);

  // Initialize slider when duration becomes available
  useEffect(() => {
    if (duration > 0 && !isDragging) {
      const newValue = (position / duration) * 100;
      setSliderValue(isNaN(newValue) ? 0 : newValue);
    }
  }, [duration, position, isDragging]);

  const episodeTitle = currentTrack?.episodeTitle ?? 'Nothing playing';
  const artworkUrl = currentTrack?.podcastImageUrl || currentTrack?.episodeThumbnail;
  const podcastTitle = currentTrack?.podcastTitle ?? 'Pick an episode to start listening';
  const podcastAuthor = currentTrack?.podcastAuthor ?? '';

  // Format time from milliseconds
  const formatTime = (millis: number): string => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle slider value change (while dragging)
  const handleSliderValueChange = (value: number) => {
    setSliderValue(value);
  };

  // Handle slider touch start
  const handleSliderTouchStart = () => {
    setIsDragging(true);
  };

  // Handle slider release (seek to position)
  const handleSliderComplete = (value: number) => {
    setIsDragging(false);
    if (duration > 0) {
      const seekPosition = (value / 100) * duration;
      seek(seekPosition);
    }
  };

  const handleShare = async () => {
    if (!currentTrack) {
      return;
    }

    const authorText = currentTrack.podcastAuthor ? ` by ${currentTrack.podcastAuthor}` : '';
    const urlText = currentTrack.podcastRssUrl ? `\n\nPodcast feed: ${currentTrack.podcastRssUrl}` : '';

    try {
      await Share.share({
        title: currentTrack.podcastTitle,
        message: `I'm listening to "${currentTrack.episodeTitle}" from "${currentTrack.podcastTitle}"${authorText}.${urlText}`,
        url: currentTrack.podcastRssUrl,
      });
    } catch (error) {
      console.error('Failed to share podcast:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTapTarget}>
          <ThemedText style={styles.backButton}>⌄</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          disabled={!currentTrack}
          style={[styles.shareButton, !currentTrack && styles.shareButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Share podcast">
          <Ionicons name="share-outline" size={24} color={currentTrack ? '#007AFF' : '#A0A0A0'} />
        </TouchableOpacity>
      </ThemedView>

      {/* Content */}
      <View style={styles.content}>
        {/* Podcast Artwork */}
        <ThemedView style={styles.artworkContainer}>
          {artworkUrl ? (
            <Image source={{ uri: artworkUrl }} style={styles.artwork} contentFit="cover" />
          ) : (
            <ThemedView style={[styles.artwork, styles.artworkPlaceholder]}>
              <ThemedText style={styles.placeholderText}>🎙️</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {!currentTrack && (
          <ThemedView style={styles.emptyStateContainer}>
            <ThemedText style={styles.emptyStateText}>Start playback from an episode page.</ThemedText>
          </ThemedView>
        )}

        {/* Episode Info */}
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

        {/* Progress Bar with Slider */}
        <ThemedView style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={sliderValue}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
            thumbTintColor="#007AFF"
            onValueChange={handleSliderValueChange}
            onSlidingStart={handleSliderTouchStart}
            onSlidingComplete={handleSliderComplete}
            disabled={isLoading || duration === 0}
          />
          <ThemedView style={styles.timeContainer}>
            <ThemedText style={styles.timeText}>
              {isDragging ? formatTime((sliderValue / 100) * duration) : formatTime(position)}
            </ThemedText>
            <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Error Display */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}

        {/* Controls */}
        <ThemedView style={styles.controlsContainer}>
          {/* Skip Backward 15 seconds */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => skipBackward(15)}
            disabled={isLoading || duration === 0 || !currentTrack}>
            <View style={styles.skipIconWrapper}>
              <Ionicons name="play-back" size={24} color="#000" />
            </View>
            <ThemedText style={[styles.skipLabel, styles.skipLabelLeft]}>15</ThemedText>
          </TouchableOpacity>

          {/* Play/Pause Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={isPlaying ? pause : play}
            disabled={isLoading || !currentTrack}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={26}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>

          {/* Skip Forward 15 seconds */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => skipForward(15)}
            disabled={isLoading || duration === 0 || !currentTrack}>
            <View style={styles.skipIconWrapper}>
              <Ionicons name="play-forward" size={24} color="#000" />
            </View>
            <ThemedText style={[styles.skipLabel, styles.skipLabelRight]}>15</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    fontSize: 30,
    lineHeight: 30,
  },
  backButtonTapTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  artworkContainer: {
    marginBottom: 32,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 16,
  },
  artworkPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 100,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    gap: 8,
  },
  emptyStateContainer: {
    marginTop: -16,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  episodeTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  podcastTitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  podcastAuthor: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    width: '100%',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipIconWrapper: {
    position: 'absolute',
    width: '100%',
    top: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8E8E93',
  },
  playButtonText: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  controlButtonText: {
    fontSize: 24,
    color: '#000000',
  },
  skipLabel: {
    position: 'absolute',
    bottom: 4,
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },
  skipLabelLeft: {
    left: 8,
    textAlign: 'left',
  },
  skipLabelRight: {
    right: 8,
    textAlign: 'right',
  },
  disabledButton: {
    opacity: 0.3,
  },
});

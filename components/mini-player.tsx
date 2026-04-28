import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAudioPlayer } from '@/hooks/use-audio-player';

const MINI_PLAYER_HEIGHT = 68;
const TAB_BAR_HEIGHT = 56;
const SWIPE_THRESHOLD = 80;

export function MiniPlayer() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, isLoading, hasTrackLoaded, togglePlayPause, dismissPlayer } = useAudioPlayer();
  const activeRootSegment = segments[0];

  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_evt, gestureState) => {
        translateX.setValue(gestureState.dx);
        const progress = Math.min(Math.abs(gestureState.dx) / SWIPE_THRESHOLD, 1);
        opacity.setValue(1 - progress * 0.6);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (Math.abs(gestureState.dx) >= SWIPE_THRESHOLD) {
          const direction = gestureState.dx > 0 ? 500 : -500;
          Animated.parallel([
            Animated.timing(translateX, { toValue: direction, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            void dismissPlayer();
            translateX.setValue(0);
            opacity.setValue(1);
          });
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  if (!hasTrackLoaded || !currentTrack || activeRootSegment === '(auth)' || activeRootSegment === 'player') {
    return null;
  }

  const bottomOffset = activeRootSegment === '(tabs)' ? insets.bottom + TAB_BAR_HEIGHT : insets.bottom;
  const artworkUrl = currentTrack.podcastImageUrl || currentTrack.episodeThumbnail;

  return (
    <Animated.View
      style={[styles.container, { bottom: bottomOffset, transform: [{ translateX }], opacity }]}
      {...panResponder.panHandlers}>
      <Pressable style={styles.innerRow} onPress={() => router.push('/player')}>
        <Image
          source={artworkUrl ? { uri: artworkUrl } : require('@/assets/images/icon.png')}
          style={styles.artwork}
          contentFit="cover"
        />
        <View style={styles.textContainer}>
          <ThemedText numberOfLines={1} style={styles.episodeTitle}>
            {currentTrack.episodeTitle}
          </ThemedText>
          <ThemedText numberOfLines={1} style={styles.podcastTitle}>
            {currentTrack.podcastTitle}
          </ThemedText>
        </View>
        <Pressable
          style={styles.playButton}
          onPress={(event) => {
            event.stopPropagation();
            void togglePlayPause();
          }}>
          {isLoading ? (
            <ThemedText style={styles.playButtonText}>...</ThemedText>
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export const miniPlayerHeight = MINI_PLAYER_HEIGHT;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: MINI_PLAYER_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#111111',
    zIndex: 30,
    overflow: 'hidden',
  },
  innerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  podcastTitle: {
    color: '#D0D0D0',
    fontSize: 12,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

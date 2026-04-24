import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAudioPlayer } from '@/hooks/use-audio-player';

const MINI_PLAYER_HEIGHT = 68;
const TAB_BAR_HEIGHT = 56;

export function MiniPlayer() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, isLoading, hasTrackLoaded, togglePlayPause } = useAudioPlayer();
  const activeRootSegment = segments[0];

  if (!hasTrackLoaded || !currentTrack || activeRootSegment === '(auth)' || activeRootSegment === 'player') {
    return null;
  }

  const bottomOffset = activeRootSegment === '(tabs)' ? insets.bottom + TAB_BAR_HEIGHT  : insets.bottom ;

  return (
    <Pressable style={[styles.container, { bottom: bottomOffset }]} onPress={() => router.push('/player')}>
      <Image
        source={currentTrack.episodeThumbnail ? { uri: currentTrack.episodeThumbnail } : require('@/assets/images/icon.png')}
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
        <ThemedText style={styles.playButtonText}>{isLoading ? '...' : isPlaying ? '⏸' : '▶'}</ThemedText>
      </Pressable>
    </Pressable>
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
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 30,
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

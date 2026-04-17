import { StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Episode } from '@/types/podcast';

type EpisodeCardProps = {
  episode: Episode;
  onPress?: (episode: Episode) => void;
};

export function EpisodeCard({ episode, onPress }: EpisodeCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress?.(episode)}
      activeOpacity={0.7}
      style={styles.container}>
      <ThemedView style={styles.card}>
        {episode.thumbnail ? (
          <Image source={{ uri: episode.thumbnail }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <ThemedView style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <ThemedText style={styles.placeholderText}>🎙️</ThemedText>
          </ThemedView>
        )}
        <ThemedView style={styles.infoContainer}>
          <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
            {episode.title}
          </ThemedText>
          <ThemedView style={styles.metaContainer}>
            {episode.publishDate && (
              <ThemedText style={styles.metaText}>{formatDate(episode.publishDate)}</ThemedText>
            )}
            {episode.duration && (
              <ThemedText style={styles.metaText}> • {episode.duration}</ThemedText>
            )}
          </ThemedView>
          {episode.description && (
            <ThemedText style={styles.description} numberOfLines={2}>
              {episode.description.replace(/<[^>]*>/g, '').trim()}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.6,
  },
  description: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
});

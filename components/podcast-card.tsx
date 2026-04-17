import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type PodcastCardProps = {
  title: string;
  author: string;
  thumbnail?: string;
  onPress?: () => void;
};

export function PodcastCard({ title, author, thumbnail, onPress }: PodcastCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.thumbnailContainer}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} contentFit="cover" />
          ) : (
            <ThemedView style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <ThemedText style={styles.placeholderText}>📻</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        <ThemedView style={styles.infoContainer}>
          <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.author} numberOfLines={1}>
            {author}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    gap: 12,
  },
  thumbnailContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    opacity: 0.7,
  },
});

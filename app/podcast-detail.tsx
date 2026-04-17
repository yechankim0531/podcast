import { ScrollView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePodcastRSS } from '@/hooks/use-podcast-rss';
import { EpisodeCard } from '@/components/episode-card';

export default function PodcastDetailScreen() {
  const { rssUrl } = useLocalSearchParams<{ rssUrl: string | string[] }>();
  // Handle both string and array (Expo Router sometimes returns arrays)
  const rssUrlString = Array.isArray(rssUrl) ? rssUrl[0] : rssUrl;
  const decodedRssUrl = rssUrlString ? decodeURIComponent(rssUrlString) : null;
  const { data, loading, error } = usePodcastRSS(decodedRssUrl);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" onPress={() => router.back()} style={styles.backButton}>
            ← Back
          </ThemedText>
        </ThemedView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading podcast...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !data) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" onPress={() => router.back()} style={styles.backButton}>
            ← Back
          </ThemedText>
        </ThemedView>
        <View style={styles.errorContainer}>
          <ThemedText type="subtitle" style={styles.errorText}>
            Error loading podcast
          </ThemedText>
          <ThemedText style={styles.errorMessage}>{error || 'Unknown error'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const { metadata, episodes } = data;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" onPress={() => router.back()} style={styles.backButton}>
          ← Back
        </ThemedText>
      </ThemedView>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Podcast Header */}
        <ThemedView style={styles.podcastHeader}>
          {metadata.imageUrl ? (
            <Image source={{ uri: metadata.imageUrl }} style={styles.podcastImage} contentFit="cover" />
          ) : (
            <ThemedView style={[styles.podcastImage, styles.podcastImagePlaceholder]}>
              <ThemedText style={styles.placeholderText}>📻</ThemedText>
            </ThemedView>
          )}
          <ThemedView style={styles.podcastInfo}>
            <ThemedText type="title" style={styles.podcastTitle}>
              {metadata.title}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.podcastAuthor}>
              {metadata.author}
            </ThemedText>
            {metadata.description && (
              <ThemedText style={styles.podcastDescription} numberOfLines={3}>
                {metadata.description}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        {/* Episodes List */}
        <ThemedView style={styles.episodesSection}>
          <ThemedText type="subtitle" style={styles.episodesTitle}>
            Episodes ({episodes.length})
          </ThemedText>
          {episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              onPress={(ep) => {
                // Navigate to episode detail with episode data
                router.push({
                  pathname: '/episode-detail',
                  params: {
                    episodeTitle: encodeURIComponent(ep.title),
                    episodeDescription: encodeURIComponent(ep.description),
                    episodeAudioUrl: encodeURIComponent(ep.audioUrl),
                    episodePublishDate: encodeURIComponent(ep.publishDate),
                    episodeDuration: ep.duration ? encodeURIComponent(ep.duration) : '',
                    episodeThumbnail: ep.thumbnail ? encodeURIComponent(ep.thumbnail) : '',
                    podcastTitle: encodeURIComponent(metadata.title),
                    podcastAuthor: encodeURIComponent(metadata.author),
                  },
                });
              }}
            />
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    fontSize: 18,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  errorText: {
    color: '#FF3B30',
  },
  errorMessage: {
    textAlign: 'center',
    opacity: 0.7,
  },
  podcastHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  podcastImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  podcastImagePlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  podcastInfo: {
    flex: 1,
    gap: 8,
  },
  podcastTitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  podcastAuthor: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  podcastDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  episodesSection: {
    paddingHorizontal: 16,
  },
  episodesTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
});

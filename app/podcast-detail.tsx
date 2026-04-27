import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

import { EpisodeCard } from '@/components/episode-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatarButton } from '@/components/user-avatar-button';
import { useAuth } from '@/contexts/auth-context';
import { usePodcastRSS } from '@/hooks/use-podcast-rss';

export default function PodcastDetailScreen() {
  const { rssUrl } = useLocalSearchParams<{ rssUrl: string | string[] }>();
  // Handle both string and array (Expo Router sometimes returns arrays)
  const rssUrlString = Array.isArray(rssUrl) ? rssUrl[0] : rssUrl;
  const decodedRssUrl = rssUrlString ? decodeURIComponent(rssUrlString) : null;
  const { data, loading, error } = usePodcastRSS(decodedRssUrl);
  const { user, loading: authLoading } = useAuth();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            ← Back
          </ThemedText>
          <UserAvatarButton
            user={user}
            authLoading={authLoading}
            onPress={() => router.push('/(tabs)/profile')}
          />
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
          <ThemedText type="title" onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            ← Back
          </ThemedText>
          <UserAvatarButton
            user={user}
            authLoading={authLoading}
            onPress={() => router.push('/(tabs)/profile')}
          />
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

  // Clean HTML from description
  const cleanDescription = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const sharePodcast = async () => {
    const authorText = metadata.author ? ` by ${metadata.author}` : '';
    const feedText = decodedRssUrl ? `\n\nPodcast feed: ${decodedRssUrl}` : '';

    try {
      await Share.share({
        title: metadata.title,
        message: `Check out "${metadata.title}"${authorText}.${feedText}`,
        url: decodedRssUrl ?? metadata.websiteUrl,
      });
    } catch (err) {
      console.error('Failed to share podcast:', err);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          ← Back
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={sharePodcast}
            style={styles.shareButton}
            accessibilityRole="button"
            accessibilityLabel="Share podcast">
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <UserAvatarButton
            user={user}
            authLoading={authLoading}
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>
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
              <TouchableOpacity onPress={toggleDescription} activeOpacity={0.7}>
                <ThemedText style={styles.podcastDescription} numberOfLines={isDescriptionExpanded ? undefined : 3}>
                  {cleanDescription(metadata.description)}
                  {!isDescriptionExpanded && cleanDescription(metadata.description).length > 150 && (
                    <ThemedText style={styles.readMoreText}> ... Read more</ThemedText>
                  )}
                  {isDescriptionExpanded && (
                    <ThemedText style={styles.showLessText}> Show less</ThemedText>
                  )}
                </ThemedText>
              </TouchableOpacity>
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
                  pathname: '/(tabs)/episode-detail',
                  params: {
                    episodeTitle: encodeURIComponent(ep.title),
                    episodeDescription: encodeURIComponent(ep.description),
                    episodeAudioUrl: encodeURIComponent(ep.audioUrl),
                    episodePublishDate: encodeURIComponent(ep.publishDate),
                    episodeDuration: ep.duration ? encodeURIComponent(ep.duration) : '',
                    episodeThumbnail: ep.thumbnail ? encodeURIComponent(ep.thumbnail) : '',
                    episodeTranscriptUrl: ep.transcriptUrl ? encodeURIComponent(ep.transcriptUrl) : '',
                    episodeTranscriptType: ep.transcriptType ? encodeURIComponent(ep.transcriptType) : '',
                    episodeTranscriptLanguage: ep.transcriptLanguage ? encodeURIComponent(ep.transcriptLanguage) : '',
                    podcastTitle: encodeURIComponent(metadata.title),
                    podcastAuthor: encodeURIComponent(metadata.author),
                    podcastRssUrl: decodedRssUrl ? encodeURIComponent(decodedRssUrl) : '',
                    podcastImageUrl: metadata.imageUrl ? encodeURIComponent(metadata.imageUrl) : '',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    fontSize: 18,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 122, 255, 0.25)',
    backgroundColor: '#FFFFFF',
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
  readMoreText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  showLessText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  episodesSection: {
    paddingHorizontal: 16,
  },
  episodesTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
});

import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAudioPlayer } from '@/hooks/use-audio-player';

export default function EpisodeDetailScreen() {
  const { playTrack } = useAudioPlayer();
  const params = useLocalSearchParams<{
    episodeTitle: string;
    episodeDescription: string;
    episodeAudioUrl: string;
    episodePublishDate: string;
    episodeDuration?: string;
    episodeThumbnail?: string;
    podcastTitle: string;
    podcastAuthor: string;
  }>();

  // Decode URL-encoded strings
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
  const episodeDescription = decodeParam(params.episodeDescription);
  const episodeAudioUrl = decodeParam(params.episodeAudioUrl);
  const episodePublishDate = decodeParam(params.episodePublishDate);
  const episodeDuration = params.episodeDuration ? decodeParam(params.episodeDuration) : undefined;
  const episodeThumbnail = params.episodeThumbnail ? decodeParam(params.episodeThumbnail) : undefined;
  const podcastTitle = decodeParam(params.podcastTitle);
  const podcastAuthor = decodeParam(params.podcastAuthor);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Clean HTML from description
  const cleanDescription = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" onPress={() => router.back()} style={styles.backButton}>
          ← Back
        </ThemedText>
      </ThemedView>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Episode Header */}
        <ThemedView style={styles.episodeHeader}>
          {episodeThumbnail ? (
            <Image source={{ uri: episodeThumbnail }} style={styles.episodeImage} contentFit="cover" />
          ) : (
            <ThemedView style={[styles.episodeImage, styles.episodeImagePlaceholder]}>
              <ThemedText style={styles.placeholderText}>🎙️</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Episode Info */}
        <ThemedView style={styles.episodeInfo}>
          <ThemedText type="title" style={styles.episodeTitle}>
            {episodeTitle}
          </ThemedText>

          <ThemedView style={styles.podcastInfo}>
            <ThemedText type="subtitle" style={styles.podcastTitle}>
              {podcastTitle}
            </ThemedText>
            <ThemedText style={styles.podcastAuthor}>{podcastAuthor}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.metaContainer}>
            {episodePublishDate && (
              <ThemedText style={styles.metaText}>{formatDate(episodePublishDate)}</ThemedText>
            )}
            {episodeDuration && (
              <ThemedText style={styles.metaText}> • {episodeDuration}</ThemedText>
            )}
          </ThemedView>

          {/* Play Button */}
          <ThemedView style={styles.playButtonContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => {
                void playTrack({
                  episodeTitle,
                  episodeAudioUrl,
                  episodeThumbnail,
                  podcastTitle,
                  podcastAuthor,
                });
              }}>
              <ThemedText style={styles.playButtonText}>▶ Play Episode</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Episode Description */}
          {episodeDescription && (
            <ThemedView style={styles.descriptionSection}>
              <ThemedText type="subtitle" style={styles.descriptionTitle}>
                About this episode
              </ThemedText>
              <ThemedText style={styles.description}>
                {cleanDescription(episodeDescription)}
              </ThemedText>
              
              {/* Host Information */}
              <ThemedView style={styles.hostSection}>
                <ThemedText type="subtitle" style={styles.hostTitle}>
                  Host
                </ThemedText>
                <ThemedText style={styles.hostName}>
                  {podcastAuthor}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
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
    paddingBottom: 40,
  },
  episodeHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  episodeImage: {
    width: 300,
    height: 300,
    borderRadius: 16,
  },
  episodeImagePlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  episodeInfo: {
    paddingHorizontal: 16,
    gap: 16,
  },
  episodeTitle: {
    fontSize: 28,
    marginBottom: 8,
    lineHeight: 36,
  },
  podcastInfo: {
    marginBottom: 8,
  },
  podcastTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  podcastAuthor: {
    fontSize: 16,
    opacity: 0.7,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    opacity: 0.6,
  },
  playButtonContainer: {
    marginVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  playButtonHint: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  descriptionSection: {
    marginTop: 8,
    gap: 12,
  },
  descriptionTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 16, // Add spacing between description and host section
  },
  hostSection: {
    marginTop: 8,
  },
  hostTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  hostName: {
    fontSize: 16,
    opacity: 0.8,
  },
  audioUrlContainer: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: 4,
  },
  audioUrlLabel: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '600',
  },
  audioUrl: {
    fontSize: 11,
    opacity: 0.5,
    fontFamily: 'monospace',
  },
});

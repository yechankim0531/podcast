import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { PodcastCard } from '@/components/podcast-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLikedPodcasts, type LikedPodcast } from '@/contexts/liked-podcasts-context';

export default function LikedPodcastsScreen() {
  const { likedPodcasts } = useLikedPodcasts();

  const openPodcast = (podcast: LikedPodcast) => {
    router.push({
      pathname: '/(tabs)/podcast-detail',
      params: { rssUrl: encodeURIComponent(podcast.rssUrl) },
    });
  };

  const renderPodcast = ({ item }: { item: LikedPodcast }) => (
    <View style={styles.podcastItem}>
      <PodcastCard
        title={item.title}
        author={item.author}
        thumbnail={item.imageUrl}
        onPress={() => openPodcast(item)}
      />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Liked Podcasts
        </ThemedText>
      </ThemedView>

      {likedPodcasts.length > 0 ? (
        <FlatList
          data={likedPodcasts}
          keyExtractor={(item) => item.rssUrl}
          renderItem={renderPodcast}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#CCCCCC" />
          <ThemedText style={styles.emptyTitle}>No liked podcasts yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Tap the heart on a podcast page to save it here.
          </ThemedText>
        </View>
      )}
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
    gap: 12,
    padding: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  podcastItem: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});

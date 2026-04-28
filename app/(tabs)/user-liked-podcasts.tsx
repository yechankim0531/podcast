import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { PodcastCard } from '@/components/podcast-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/lib/firebase';

interface LikedPodcast {
  title: string;
  author: string;
  imageUrl?: string;
  rssUrl: string;
  likedAt: string;
}

export default function UserLikedPodcastsScreen() {
  const { uid, displayName } = useLocalSearchParams<{ uid: string; displayName: string }>();
  const [podcasts, setPodcasts] = useState<LikedPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, 'users', uid, 'likedPodcasts'),
          orderBy('likedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const results: LikedPodcast[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            title: data.title as string,
            author: data.author as string,
            imageUrl: data.imageUrl as string | undefined,
            rssUrl: data.rssUrl as string,
            likedAt:
              data.likedAt instanceof Timestamp
                ? data.likedAt.toDate().toISOString()
                : (data.likedAt as string),
          };
        });
        setPodcasts(results);
      } catch (e) {
        setError('Failed to load liked podcasts.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  const openPodcast = (rssUrl: string) => {
    router.push({
      pathname: '/(tabs)/podcast-detail',
      params: { rssUrl: encodeURIComponent(rssUrl) },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title} numberOfLines={1}>
          {displayName ? `${displayName}'s Likes` : 'Liked Podcasts'}
        </ThemedText>
      </ThemedView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : podcasts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={64} color="#CCCCCC" />
          <ThemedText style={styles.emptyTitle}>No liked podcasts yet</ThemedText>
        </View>
      ) : (
        <FlatList
          data={podcasts}
          keyExtractor={(item) => item.rssUrl}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.podcastItem}>
              <PodcastCard
                title={item.title}
                author={item.author}
                thumbnail={item.imageUrl}
                onPress={() => openPodcast(item.rssUrl)}
              />
            </View>
          )}
        />
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  podcastItem: {
    marginBottom: 16,
  },
});

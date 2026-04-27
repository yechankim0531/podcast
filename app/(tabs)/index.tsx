import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { HorizontalPodcastList } from '@/components/horizontal-podcast-list';
import { ProfileSidePanel } from '@/components/profile-side-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatarButton } from '@/components/user-avatar-button';
import { useAudioPlayerContext } from '@/contexts/audio-player-context';
import { useAuth } from '@/contexts/auth-context';
import { fetchRecommendedPodcasts, fetchTrendingPodcasts } from '@/services/api/podcast-api';

interface PodcastItem {
  title: string;
  author: string;
  imageUrl?: string;
  rssUrl: string;
}

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { listeningHistory } = useAudioPlayerContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [yourPodcasts, setYourPodcasts] = useState<PodcastItem[]>([]);
  const [recommendedPodcasts, setRecommendedPodcasts] = useState<PodcastItem[]>([]);
  const [trendingPodcasts, setTrendingPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsProfileOpen(false);
    }
  }, [user]);

  useEffect(() => {
    loadPodcasts();
  }, [user, listeningHistory]);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load your podcasts from listening history
      const yourPodcastsData = Array.from(
        new Map(
          listeningHistory.map(item => [item.podcastRssUrl, {
            title: item.podcastTitle,
            author: item.podcastAuthor || 'Unknown Author',
            imageUrl: item.podcastImageUrl,
            rssUrl: item.podcastRssUrl,
          }])
        ).values()
      );
      setYourPodcasts(yourPodcastsData);

      const yourRssUrls = new Set(yourPodcastsData.map(p => p.rssUrl));
      const filterYourPodcasts = (podcasts: PodcastItem[]) =>
        podcasts.filter(p => !yourRssUrls.has(p.rssUrl));

      // Load recommended podcasts
      if (user) {
        try {
          const recommended = await fetchRecommendedPodcasts(user.uid);
          setRecommendedPodcasts(filterYourPodcasts(Array.from(
            new Map(
              recommended.map(p => [p.rssFeedUrl, {
                title: p.title,
                author: p.author,
                imageUrl: p.imageUrl,
                rssUrl: p.rssFeedUrl,
              }])
            ).values()
          )));
        } catch (err) {
          console.warn('Failed to load recommendations:', err);
          // Fallback to trending if recommendations fail
          const trending = await fetchTrendingPodcasts();
          setRecommendedPodcasts(filterYourPodcasts(Array.from(
            new Map(
              trending.slice(0, 10).map(p => [p.rssFeedUrl, {
                title: p.title,
                author: p.author,
                imageUrl: p.imageUrl,
                rssUrl: p.rssFeedUrl,
              }])
            ).values()
          )));
        }
      }

      // Load trending podcasts
      const trending = await fetchTrendingPodcasts();
      setTrendingPodcasts(filterYourPodcasts(Array.from(
        new Map(
          trending.map(p => [p.rssFeedUrl, {
            title: p.title,
            author: p.author,
            imageUrl: p.imageUrl,
            rssUrl: p.rssFeedUrl,
          }])
        ).values()
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load podcasts');
    } finally {
      setLoading(false);
    }
  };

  const onAvatarPress = () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    setIsProfileOpen((open) => !open);
  };

  const handlePodcastPress = (rssUrl: string) => {
    const encodedUrl = encodeURIComponent(rssUrl);
    router.push({ pathname: '/(tabs)/podcast-detail', params: { rssUrl: encodedUrl } });
  };

  const headerAvatar = (
    <UserAvatarButton user={user} authLoading={authLoading} onPress={onAvatarPress} />
  );

  const profileOverlay =
    user != null ? (
      <ProfileSidePanel
        open={isProfileOpen}
        user={user}
        onClose={() => setIsProfileOpen(false)}
      />
    ) : null;

  if (loading) {
    return (
      <>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <View style={styles.headerRow}>
              <ThemedText type="title" style={styles.heading}>
                Podcasts
              </ThemedText>
              {headerAvatar}
            </View>
          </ThemedView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Loading podcasts...</ThemedText>
          </View>
        </ThemedView>
        {profileOverlay}
      </>
    );
  }

  if (error) {
    return (
      <>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <View style={styles.headerRow}>
              <ThemedText type="title" style={styles.heading}>
                Podcasts
              </ThemedText>
              {headerAvatar}
            </View>
          </ThemedView>
          <View style={styles.errorContainer}>
            <ThemedText type="subtitle" style={styles.errorText}>
              Error loading podcasts
            </ThemedText>
            <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          </View>
        </ThemedView>
        {profileOverlay}
      </>
    );
  }

  return (
    <>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.heading}>
              Podcasts
            </ThemedText>
            {headerAvatar}
          </View>
        </ThemedView>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <HorizontalPodcastList
            title="Your Podcasts"
            podcasts={yourPodcasts}
            onPodcastPress={handlePodcastPress}
            emptyMessage="Listen to some podcasts to see them here!"
          />
          
          <HorizontalPodcastList
            title="Recommended for You"
            podcasts={recommendedPodcasts}
            onPodcastPress={handlePodcastPress}
          />
          
          <HorizontalPodcastList
            title="Trending Now"
            podcasts={trendingPodcasts}
            onPodcastPress={handlePodcastPress}
          />
        </ScrollView>
      </ThemedView>
      {profileOverlay}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
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
});

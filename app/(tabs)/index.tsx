import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import { PodcastCard } from '@/components/podcast-card';
import { ProfileSidePanel } from '@/components/profile-side-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatarButton } from '@/components/user-avatar-button';
import { useAuth } from '@/contexts/auth-context';
import { usePodcastRSS } from '@/hooks/use-podcast-rss';

// RSS Feed URL for The Protocol podcast
const RSS_FEED_URL = 'https://feeds.simplecast.com/CnNx__EM';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data, loading, error } = usePodcastRSS(RSS_FEED_URL);

  useEffect(() => {
    if (!user) {
      setIsProfileOpen(false);
    }
  }, [user]);

  const onAvatarPress = () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    setIsProfileOpen((open) => !open);
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

  const handlePodcastPress = () => {
    const encodedUrl = encodeURIComponent(RSS_FEED_URL);
    router.push({
      pathname: '/podcast-detail',
      params: { rssUrl: encodedUrl },
    });
  };

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
            <ThemedText style={styles.loadingText}>Loading podcast...</ThemedText>
          </View>
        </ThemedView>
        {profileOverlay}
      </>
    );
  }

  if (error || !data) {
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
              Error loading podcast
            </ThemedText>
            <ThemedText style={styles.errorMessage}>{error || 'Unknown error'}</ThemedText>
          </View>
        </ThemedView>
        {profileOverlay}
      </>
    );
  }

  const { metadata } = data;

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
          <PodcastCard
            title={metadata.title}
            author={metadata.author}
            thumbnail={metadata.imageUrl}
            onPress={handlePodcastPress}
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
});

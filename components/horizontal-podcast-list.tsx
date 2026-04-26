import { ScrollView, StyleSheet } from 'react-native';

import { PodcastCard } from '@/components/podcast-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface PodcastItem {
  title: string;
  author: string;
  imageUrl?: string;
  rssUrl: string;
}

interface HorizontalPodcastListProps {
  title: string;
  podcasts: PodcastItem[];
  onPodcastPress: (rssUrl: string) => void;
  emptyMessage?: string;
}

export function HorizontalPodcastList({
  title,
  podcasts,
  onPodcastPress,
  emptyMessage,
}: HorizontalPodcastListProps) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {podcasts.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            {emptyMessage || 'No podcasts available'}
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {podcasts.map((item, index) => (
            <ThemedView key={`${item.rssUrl}-${index}`} style={styles.cardWrapper}>
              <PodcastCard
                title={item.title}
                author={item.author}
                thumbnail={item.imageUrl}
                onPress={() => onPodcastPress(item.rssUrl)}
              />
            </ThemedView>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: 200,
    marginRight: 12,
  },
});
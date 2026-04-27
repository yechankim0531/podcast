import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { PodcastCard } from '@/components/podcast-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { searchPodcasts } from '@/services/api/podcast-api';
import type { PodcastMetadata } from '@/types/podcast';

export default function SearchScreen() {
  const segments = useSegments();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PodcastMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const isTabsSearch = segments[0] === '(tabs)';

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      try {
        const searchResults = await searchPodcasts(query.trim());
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handlePodcastPress = (rssUrl: string) => {
    router.push({
      pathname: isTabsSearch ? '/(tabs)/podcast-detail' : '/podcast-detail',
      params: { rssUrl: encodeURIComponent(rssUrl) },
    });
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const renderPodcast = ({ item }: { item: PodcastMetadata }) => (
    <View style={styles.podcastItem}>
      <PodcastCard
        title={item.title}
        author={item.author}
        thumbnail={item.imageUrl}
        onPress={() => handlePodcastPress(item.rssFeedUrl)}
      />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header with back button and search bar */}
      <ThemedView style={styles.header}>
        {!isTabsSearch && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        <ThemedView style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search podcasts..."
            placeholderTextColor="#666"
            autoFocus={true}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>

      {/* Search Results */}
      <ThemedView style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Searching...</ThemedText>
          </View>
        ) : hasSearched && results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>No podcasts found</ThemedText>
            <ThemedText style={styles.emptyText}>
              Try searching with different keywords
            </ThemedText>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.rssFeedUrl}
            renderItem={renderPodcast}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : !hasSearched ? (
          <View style={styles.initialContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <ThemedText style={styles.initialTitle}>Search for podcasts</ThemedText>
            <ThemedText style={styles.initialText}>
              Start typing to find your favorite podcasts
            </ThemedText>
          </View>
        ) : null}
      </ThemedView>
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
    padding: 16,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  initialTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  initialText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  podcastItem: {
    marginBottom: 16,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { searchPodcasts } from '@/services/api/podcast-api';
import type { PodcastMetadata } from '@/types/podcast';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onPodcastSelect?: (rssUrl: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, onPodcastSelect, placeholder = 'Search podcasts...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PodcastMetadata[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchPodcasts(query.trim());
        setSuggestions(results.slice(0, 5)); // Limit to 5 suggestions
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300); // Debounce API calls
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSubmit = () => {
    handleSearch();
  };

  const handleSuggestionPress = (suggestion: PodcastMetadata) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    if (onPodcastSelect && suggestion.rssFeedUrl) {
      onPodcastSelect(suggestion.rssFeedUrl);
    } else {
      onSearch(suggestion.title);
    }
  };

  const renderSuggestion = ({ item }: { item: PodcastMetadata }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="mic" size={16} color="#666" style={styles.suggestionIcon} />
      <View style={styles.suggestionText}>
        <ThemedText style={styles.suggestionTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.suggestionAuthor} numberOfLines={1}>
          {item.author}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#666"
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </ThemedView>
      <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
        <Ionicons name="search" size={20} color="#fff" />
      </TouchableOpacity>

      {showSuggestions && (
        <ThemedView style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.rssFeedUrl}
            renderItem={renderSuggestion}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 72, // Account for search button width + gap
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  suggestionAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
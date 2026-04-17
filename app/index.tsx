import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * App entry: wait for Firebase auth, then send users to login or main tabs.
 */
export default function IndexGate() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

import { MiniPlayer } from '@/components/mini-player';
import { AudioPlayerProvider } from '@/contexts/audio-player-context';
import { AuthProvider } from '@/contexts/auth-context';
import { LikedPodcastsProvider } from '@/contexts/liked-podcasts-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import '@/lib/firebase';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AudioPlayerProvider>
          <LikedPodcastsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="search" options={{ presentation: 'card' }} />
              <Stack.Screen name="podcast-detail" options={{ presentation: 'card' }} />
              <Stack.Screen name="episode-detail" options={{ presentation: 'card' }} />
              <Stack.Screen name="player" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            </Stack>
            <MiniPlayer />
          </LikedPodcastsProvider>
          <StatusBar style="auto" />
        </AudioPlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

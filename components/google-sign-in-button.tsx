import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/auth-errors';

type GoogleAuthExtra = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  /** e.g. @anonymous/podcast-mvp — used to build https://auth.expo.io/... in Expo Go */
  expoAuthProxyFullName?: string;
};

/**
 * Google Web OAuth rejects exp:// redirect URIs. In Expo Go, use Expo's HTTPS proxy instead.
 * @see https://docs.expo.dev/guides/google-authentication/
 */
function getGoogleRedirectUri(): string | undefined {
  if (Platform.OS === 'web') {
    return undefined;
  }
  if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
    return undefined;
  }
  const extra = Constants.expoConfig?.extra?.googleAuth as GoogleAuthExtra | undefined;
  const path =
    Constants.expoConfig?.originalFullName?.trim() ||
    extra?.expoAuthProxyFullName?.trim();
  if (!path) {
    return undefined;
  }
  return `https://auth.expo.io/${path}`;
}

type Props = {
  onError: (message: string) => void;
};

export function GoogleSignInButton({ onError }: Props) {
  const webClientId = Constants.expoConfig?.extra?.googleAuth?.webClientId as string | undefined;

  if (!webClientId) {
    return (
      <ThemedText style={styles.hint}>
        Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file (Web client ID from Firebase or Google Cloud) to
        enable Continue with Google.
      </ThemedText>
    );
  }

  return <GoogleSignInInner webClientId={webClientId} onError={onError} />;
}

function GoogleSignInInner({ webClientId, onError }: { webClientId: string; onError: (message: string) => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [busy, setBusy] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const extra = Constants.expoConfig?.extra?.googleAuth as GoogleAuthExtra | undefined;
  const redirectUri = useMemo(() => getGoogleRedirectUri(), []);

  const requestConfig = useMemo(
    () => ({
      webClientId,
      iosClientId: extra?.iosClientId,
      androidClientId: extra?.androidClientId,
      ...(redirectUri ? { redirectUri } : {}),
    }),
    [webClientId, extra?.iosClientId, extra?.androidClientId, redirectUri]
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(requestConfig);

  useEffect(() => {
    if (response?.type === 'error') {
      onErrorRef.current(response.error?.message ?? 'Google sign-in failed.');
      return;
    }
    if (response?.type === 'dismiss' || response?.type === 'cancel') {
      return;
    }
    if (response?.type !== 'success') {
      return;
    }

    const idToken = response.params.id_token;
    if (!idToken || typeof idToken !== 'string') {
      onErrorRef.current(
        'Google did not return an ID token. Check your Web OAuth client and Firebase Google sign-in.'
      );
      return;
    }

    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        if (!cancelled) {
          router.replace('/(tabs)');
        }
      } catch (e) {
        if (!cancelled) {
          onErrorRef.current(getAuthErrorMessage(e));
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.googleButton,
        {
          borderColor: palette.icon,
          backgroundColor: palette.background,
          opacity: pressed || busy || !request ? 0.75 : 1,
        },
      ]}
      disabled={!request || busy}
      onPress={() => {
        void promptAsync();
      }}>
      {busy ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.row}>
          <ThemedText style={[styles.googleLabel, { color: palette.text }]}>Continue with Google</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
  },
  googleButton: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

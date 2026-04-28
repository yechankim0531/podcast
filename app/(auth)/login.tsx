import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)');
    }
  }, [authLoading, user]);

  const onSubmit = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, trimmed, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={palette.tint} />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.lead}>
          Sign in with your email and password.
        </ThemedText>

        <TextInput
          style={[
            styles.input,
            { color: palette.text, borderColor: palette.icon, backgroundColor: palette.background },
          ]}
          placeholder="Email"
          placeholderTextColor={palette.icon}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.input,
            { color: palette.text, borderColor: palette.icon, backgroundColor: palette.background },
          ]}
          placeholder="Password"
          placeholderTextColor={palette.icon}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <ThemedText style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.tint, opacity: pressed || submitting ? 0.85 : 1 },
          ]}
          onPress={onSubmit}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonLabel}>Sign in</ThemedText>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: palette.icon }]} />
          <ThemedText style={styles.dividerText}>or</ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: palette.icon }]} />
        </View>

        <GoogleSignInButton onError={setError} />

        <View style={styles.footer}>
          <ThemedText>No account? </ThemedText>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <ThemedText type="link">Create one</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#c62828',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.4,
  },
  dividerText: {
    fontSize: 14,
    opacity: 0.6,
  },
});

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';

interface PublicUser {
  uid: string;
  displayName: string;
  photoURL: string;
}

interface UserLikedRowProps {
  onUserPress: (uid: string, displayName: string) => void;
}

export function UserLikedRow({ onUserPress }: UserLikedRowProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const q = query(collection(db, 'users'), limit(20));
        const snapshot = await getDocs(q);
        const results: PublicUser[] = [];
        snapshot.forEach((d) => {
          if (d.id === user.uid) return;
          const data = d.data();
          if (!data.displayName) return;
          results.push({
            uid: d.id,
            displayName: data.displayName as string,
            photoURL: data.photoURL as string,
          });
        });
        setUsers(results);
      } catch (e) {
        console.error('Failed to load users:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Liked by Others
        </ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      </ThemedView>
    );
  }

  if (users.length === 0) return null;

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Liked by Others
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>
        {users.map((u) => (
          <TouchableOpacity
            key={u.uid}
            style={styles.userCard}
            onPress={() => onUserPress(u.uid, u.displayName)}
            activeOpacity={0.75}>
            <View style={styles.avatarRing}>
              {u.photoURL ? (
                <Image source={{ uri: u.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={28} color="#888" />
                </View>
              )}
            </View>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {u.displayName}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  loadingContainer: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  userCard: {
    alignItems: 'center',
    width: 72,
    gap: 6,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#007AFF',
    overflow: 'hidden',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 72,
  },
});

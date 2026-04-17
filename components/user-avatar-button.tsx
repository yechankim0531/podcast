import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import type { User } from 'firebase/auth';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  user: User | null;
  authLoading: boolean;
  onPress: () => void;
  size?: number;
};

export function UserAvatarButton({ user, authLoading, onPress, size = 40 }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  if (authLoading) {
    return (
      <View style={[styles.avatarWrap, { width: size, height: size }]}>
        <ActivityIndicator size="small" color={palette.tint} />
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Profile">
      <View style={[styles.avatarWrap, { width: size, height: size }]}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={[styles.image, { width: size, height: size }]} />
        ) : (
          <IconSymbol name="person.crop.circle.fill" size={size} color={palette.tint} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: 999,
  },
});

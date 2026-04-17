import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth } from '@/lib/firebase';

type Props = {
  open: boolean;
  user: User;
  onClose: () => void;
};

/** Softer than near-black (#121212), still reads darker than app surfaces (#151718). */
const PANEL_BG = '#252528';

const PROFILE_AVATAR_SIZE = 52;

function displayNameFor(user: User): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  const email = user.email;
  if (email) return email.split('@')[0] ?? 'Account';
  return 'Account';
}

export function ProfileSidePanel({ open, user, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const panelWidth = useMemo(() => {
    const w = Dimensions.get('window').width;
    return Math.min(360, Math.round(w * 0.86));
  }, []);

  const slideX = useRef(new Animated.Value(panelWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [presented, setPresented] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const closingRef = useRef(false);
  const panGrantSlide = useRef(0);

  const animateClose = useCallback(
    (then?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: panelWidth,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        closingRef.current = false;
        if (finished) {
          setPresented(false);
          then?.();
        }
      });
    },
    [backdropOpacity, panelWidth, slideX],
  );

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    animateClose(() => {
      onClose();
    });
  }, [animateClose, onClose]);

  useEffect(() => {
    if (open) {
      setPresented(true);
    }
  }, [open]);

  useEffect(() => {
    if (!(open && presented)) return;
    closingRef.current = false;
    slideX.setValue(panelWidth);
    backdropOpacity.setValue(0);
    const anim = Animated.parallel([
      Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 65,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [backdropOpacity, open, panelWidth, presented, slideX]);

  useEffect(() => {
    if (!open && presented && !closingRef.current) {
      slideX.setValue(panelWidth);
      backdropOpacity.setValue(0);
      setPresented(false);
    }
  }, [backdropOpacity, open, panelWidth, presented, slideX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
        onPanResponderGrant: () => {
          slideX.stopAnimation((value) => {
            panGrantSlide.current = typeof value === 'number' ? value : 0;
          });
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(panelWidth, Math.max(0, panGrantSlide.current + g.dx));
          slideX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const projected = panGrantSlide.current + g.dx;
          const shouldClose = projected > panelWidth * 0.28 || g.vx > 0.65;
          if (shouldClose) {
            requestClose();
          } else {
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start();
          }
        },
      }),
    [panelWidth, requestClose, slideX],
  );

  const name = displayNameFor(user);

  const goToProfilePage = () => {
    onClose();
    router.push('/(tabs)/profile');
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      onClose();
      await signOut(auth);
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Modal
      visible={presented}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestClose}>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={presented ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Close profile menu" />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 20,
              transform: [{ translateX: slideX }],
            },
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.panelHeader}>
            <Pressable
              onPress={requestClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>

          <Pressable
            onPress={goToProfilePage}
            style={({ pressed }) => [styles.profileRow, pressed && styles.profileRowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Open profile">
            <View style={styles.avatarOuter}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
              ) : (
                <IconSymbol
                  name="person.crop.circle.fill"
                  size={Math.round(PROFILE_AVATAR_SIZE * 0.65)}
                  color="#535353"
                />
              )}
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.displayName} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.viewProfileHint}>View profile</Text>
            </View>
          </Pressable>

          <View style={styles.logoutSection}>
            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Log out">
              {loggingOut ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.logoutLabel}>Log out</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 1,
  },
  panel: {
    zIndex: 2,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: PANEL_BG,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 4,
    borderRadius: 10,
  },
  profileTextCol: {
    flex: 1,
    justifyContent: 'center',
    minHeight: PROFILE_AVATAR_SIZE,
    gap: 4,
  },
  profileRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarOuter: {
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#282828',
  },
  avatarImage: {
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
    borderRadius: 999,
  },
  displayName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: -0.2,
  },
  viewProfileHint: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  logoutSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoutButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoutLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

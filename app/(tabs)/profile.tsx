import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  EmailAuthProvider,
  reload,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, db } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { uploadProfilePhotoToStorage } from '@/lib/upload-profile-photo';

function userHasEmailPassword(user: User | null): boolean {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'password');
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordExpanded, setPasswordExpanded] = useState(false);

  const canChangePassword = useMemo(() => userHasEmailPassword(user), [user]);

  const baselineName = user?.displayName?.trim() ?? '';
  const profileDirty = useMemo(() => {
    if (!user) return false;
    const nameChanged = draftName.trim() !== baselineName;
    const photoChanged = localPhotoUri !== null;
    return nameChanged || photoChanged;
  }, [user, draftName, baselineName, localPhotoUri]);

  const openEdit = useCallback(() => {
    if (!user) return;
    setDraftName(user.displayName?.trim() ?? '');
    setLocalPhotoUri(null);
    setSaveError(null);
    setEditOpen(true);
  }, [user]);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setLocalPhotoUri(null);
    setSaveError(null);
  }, []);

  const requestPickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSaveError('Photo library access is required to change your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalPhotoUri(result.assets[0].uri);
      setSaveError(null);
    }
  }, []);

  const saveProfile = useCallback(async () => {
    if (!user || !profileDirty || saveSubmitting) return;
    const current = auth.currentUser;
    if (!current) return;
    setSaveError(null);
    setSaveSubmitting(true);
    try {
      let photoURL = current.photoURL ?? null;
      if (localPhotoUri) {
        photoURL = await uploadProfilePhotoToStorage(current.uid, localPhotoUri);
      }
      await updateProfile(current, {
        displayName: draftName.trim() || null,
        photoURL,
      });
      await setDoc(
        doc(db, 'users', current.uid),
        {
          displayName: draftName.trim(),
          photoURL: photoURL ?? '',
          email: current.email ?? '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await reload(current);
      setLocalPhotoUri(null);
      setEditOpen(false);
    } catch (e) {
      setSaveError(getAuthErrorMessage(e));
    } finally {
      setSaveSubmitting(false);
    }
  }, [user, profileDirty, saveSubmitting, localPhotoUri, draftName]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [loading, user]);

  const onLogout = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  const onChangePassword = async () => {
    setPwError(null);
    setPwMessage(null);
    if (!user?.email) {
      setPwError('No email on file for this account.');
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwError('Fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPwError('New password must be different from your current password.');
      return;
    }

    setPwSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPwMessage('Password updated successfully.');
    } catch (e) {
      setPwError(getAuthErrorMessage(e));
    } finally {
      setPwSubmitting(false);
    }
  };

  const pageBackground =
    colorScheme === 'dark' ? palette.background : '#EFEFF4';

  const saveLabelColor =
    profileDirty && !saveSubmitting
      ? colorScheme === 'dark'
        ? '#FFFFFF'
        : '#11181C'
      : '#8E8E93';

  const avatarPreviewUri = localPhotoUri ?? user?.photoURL;

  if (loading || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: pageBackground }]}>
        <ActivityIndicator size="large" color={palette.tint} />
      </View>
    );
  }

  const displayName = user.displayName?.trim() || 'No display name';
  const email = user.email ?? 'No email';

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: pageBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(24, insets.top + 8) }]}>
        <View style={styles.hero}>
          <View style={[styles.avatarRing, { borderColor: palette.icon }]}>
            {avatarPreviewUri ? (
              <Image source={{ uri: avatarPreviewUri }} style={styles.avatarImage} />
            ) : (
              <IconSymbol name="person.crop.circle.fill" size={72} color={palette.tint} />
            )}
          </View>
          <ThemedText type="title" style={[styles.name, { marginTop: 8 }]}>
            {displayName}
          </ThemedText>
          <ThemedText style={[styles.email, { color: palette.text, opacity: 0.75 }]}>{email}</ThemedText>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.editOutlineButton,
            { borderColor: palette.icon, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={openEdit}>
          <ThemedText style={[styles.editOutlineLabel, { color: palette.text }]}>Edit</ThemedText>
        </Pressable>

        {canChangePassword ? (
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.passwordDropdownHeader,
                {
                  borderColor: palette.icon,
                  backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              onPress={() => setPasswordExpanded((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: passwordExpanded }}
              accessibilityLabel="Change password">
              <ThemedText type="subtitle" style={styles.passwordDropdownTitle}>
                Change password
              </ThemedText>
              <Ionicons
                name={passwordExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={palette.icon}
              />
            </Pressable>
            {passwordExpanded ? (
              <View style={styles.passwordDropdownBody}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: palette.text,
                      borderColor: palette.icon,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
                    },
                  ]}
                  placeholder="Current password"
                  placeholderTextColor={palette.icon}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: palette.text,
                      borderColor: palette.icon,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
                    },
                  ]}
                  placeholder="New password"
                  placeholderTextColor={palette.icon}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: palette.text,
                      borderColor: palette.icon,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
                    },
                  ]}
                  placeholder="Confirm new password"
                  placeholderTextColor={palette.icon}
                  secureTextEntry
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />
                {pwError ? <ThemedText style={styles.error}>{pwError}</ThemedText> : null}
                {pwMessage ? <ThemedText style={styles.success}>{pwMessage}</ThemedText> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: palette.tint, opacity: pressed || pwSubmitting ? 0.85 : 1 },
                  ]}
                  onPress={onChangePassword}
                  disabled={pwSubmitting}>
                  {pwSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>Update password</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText style={styles.hint}>
              You signed in with Google (or another provider). Password changes are not available here—manage your
              account in Google.
            </ThemedText>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: '#c62828', opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={onLogout}>
          <ThemedText style={styles.logoutLabel}>Log out</ThemedText>
        </Pressable>
      </ScrollView>

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={closeEdit}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={closeEdit} disabled={saveSubmitting} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.background,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colorScheme === 'dark' ? '#38383A' : '#C6C6C8' }]}>
              <View style={[styles.sheetCol, { alignItems: 'flex-start' }]}>
                <Pressable onPress={closeEdit} hitSlop={10} disabled={saveSubmitting}>
                  <Text style={[styles.sheetCancel, { color: palette.tint }]}>Cancel</Text>
                </Pressable>
              </View>
              <View style={styles.sheetColCenter}>
                <Text style={[styles.sheetTitle, { color: palette.text }]} numberOfLines={1}>
                  Edit profile
                </Text>
              </View>
              <View style={[styles.sheetCol, { alignItems: 'flex-end' }]}>
                <Pressable
                  onPress={saveProfile}
                  hitSlop={10}
                  disabled={!profileDirty || saveSubmitting}>
                  {saveSubmitting ? (
                    <ActivityIndicator size="small" color={palette.tint} />
                  ) : (
                    <Text style={[styles.sheetSave, { color: saveLabelColor }]}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetBody}
              showsVerticalScrollIndicator={false}>
              <View style={styles.sheetAvatarRow}>
                <View style={[styles.sheetAvatarRing, { borderColor: palette.icon }]}>
                  {avatarPreviewUri ? (
                    <Image source={{ uri: avatarPreviewUri }} style={styles.sheetAvatarImage} />
                  ) : (
                    <IconSymbol name="person.crop.circle.fill" size={56} color={palette.tint} />
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.editPhotoButton,
                    { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={requestPickImage}
                  disabled={saveSubmitting}>
                  <Ionicons name="pencil" size={20} color="#fff" accessibilityLabel="Change profile photo" />
                </Pressable>
              </View>

              <View style={styles.fieldBlock}>
                <ThemedText style={styles.fieldLabel}>Name</ThemedText>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: palette.text,
                      borderColor: palette.icon,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
                    },
                  ]}
                  value={draftName}
                  onChangeText={(t) => {
                    setDraftName(t);
                    setSaveError(null);
                  }}
                  placeholder="Display name"
                  placeholderTextColor={palette.icon}
                  editable={!saveSubmitting}
                  autoCapitalize="words"
                  maxLength={80}
                />
              </View>

              {saveError ? <ThemedText style={styles.error}>{saveError}</ThemedText> : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: 24,
    paddingBottom: 40,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 106,
    height: 106,
    borderRadius: 999,
  },
  name: {
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    textAlign: 'center',
  },
  editOutlineButton: {
    alignSelf: 'center',
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOutlineLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  passwordDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  passwordDropdownTitle: {
    marginBottom: 0,
  },
  passwordDropdownBody: {
    gap: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#c62828',
    fontSize: 14,
  },
  success: {
    color: '#2e7d32',
    fontSize: 14,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.85,
  },
  logoutButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutLabel: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '600',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetCol: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetColCenter: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  sheetCancel: {
    fontSize: 17,
  },
  sheetSave: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 20,
  },
  sheetAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetAvatarRing: {
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheetAvatarImage: {
    width: 84,
    height: 84,
    borderRadius: 999,
  },
  editPhotoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.9,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
  },
});

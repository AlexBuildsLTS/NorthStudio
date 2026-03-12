/**
 * @file app/(app)/settings/profile.tsx
 * @description AAA+ Profile Edit Interface.
 * @target Android APK & Web ONLY.
 * @fixes
 * - Replaced deprecated MediaTypeOptions with modern Web/APK safe formats.
 * - Resolved Unmatched Route crash by ensuring default export compilation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail,
  Camera,
  Save,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { NORTH_THEME } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  const triggerSuccess = () => {
    setShowToast(true);
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowToast(false), 3000);
  };

  const uploadAvatar = async () => {
    if (!session?.user.id) return;
    try {
      setUploading(true);
      // FIX: Modernized API call to prevent Expo warnings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const image = result.assets[0];
      const fileName = `${session.user.id}/avatar_${Date.now()}.${image.uri.split('.').pop()}`;

      // Native fetch Blob conversion (no base64 dependency crashes)
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: image.mimeType ?? 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      await fetchProfile(session.user.id);
      triggerSuccess();
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;
      await fetchProfile(session.user.id);
      triggerSuccess();
    } catch (error: any) {
      Alert.alert('Save Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#050110', '#0D0221', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Custom Back Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* TOAST: Strict Ternary */}
        {showToast ? (
          <View style={styles.toastContainer}>
            <Animated.View
              entering={FadeInUp.springify()}
              exiting={FadeOut}
              style={styles.toast}
            >
              <View style={styles.toastIcon}>
                <CheckCircle2 size={16} color="#011709" />
              </View>
              <View>
                <Text style={styles.toastTitle}>Success</Text>
                <Text style={styles.toastSub}>Profile synchronized.</Text>
              </View>
            </Animated.View>
          </View>
        ) : null}

        <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={styles.avatarSection}
            >
              <TouchableOpacity
                onPress={uploadAvatar}
                disabled={uploading}
                activeOpacity={0.8}
                style={styles.avatarWrapper}
              >
                <View style={styles.avatarRing}>
                  {/* STRICT TERNARY LOGIC */}
                  {uploading ? (
                    <ActivityIndicator color={NORTH_THEME.colors.accent.cyan} />
                  ) : profile?.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Camera size={16} color="#000" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>ACCOUNT IDENTITY</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>FULL DESIGNATION</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor={NORTH_THEME.colors.text.muted}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SYSTEM ALIAS</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor={NORTH_THEME.colors.text.muted}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>VERIFIED COMM LINK</Text>
                  <View style={styles.disabledWrap}>
                    <Mail size={16} color={NORTH_THEME.colors.text.muted} />
                    <Text style={styles.disabledText}>
                      {session?.user.email}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.actionSection}
            >
              <Button
                label="COMMIT CHANGES"
                icon={<Save size={18} color="#000" />}
                onPress={handleSave}
                loading={saving}
                variant="primary"
                size="lg"
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 100,
    maxWidth: 600,
    marginHorizontal: 'auto',
    width: '100%',
  },

  toastContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toastIcon: {
    backgroundColor: '#10b981',
    padding: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  toastTitle: { color: '#4ade80', fontSize: 14, fontWeight: '800' },
  toastSub: { color: 'rgba(167, 243, 208, 0.6)', fontSize: 12 },

  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: { position: 'relative' },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 4,
    borderColor: NORTH_THEME.colors.accent.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: {
    fontSize: 48,
    fontWeight: '900',
    color: NORTH_THEME.colors.accent.cyan,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: NORTH_THEME.colors.accent.cyan,
    padding: 10,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#02010A',
  },

  card: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    backgroundColor: 'rgba(13, 2, 33, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeading: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 24,
  },

  inputGroup: { marginBottom: 20 },
  label: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    height: 56,
    fontWeight: '600',
  },
  disabledWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  disabledText: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  actionSection: { paddingHorizontal: 8 },
});

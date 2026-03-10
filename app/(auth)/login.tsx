/**
 * @file app/(auth)/login.tsx
 * @description AAA+ Standard Authentication Gateway.
 * Implements a 120fps responsive layout, Reanimated 3 physics, and Supabase session management.
 */

import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import * as Haptics from 'expo-haptics';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wand2,
  Layers,
  Box,
  MonitorPlay,
  Cpu,
  DownloadCloud,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// --- INTERNAL ARCHITECTURE IMPORTS ---
import { GlassCard } from '@/components/ui/GlassCard';
import { BentoGrid } from '@/components/bento/BentoGrid';
import { NORTH_THEME } from '@/constants/theme';

const APP_ICON = require('@/assets/images/icon.png');

const BENTO_ITEMS = [
  {
    icon: Wand2,
    title: 'AI Compositing',
    desc: 'Smart blending matching realistic fabric textures.',
  },
  {
    icon: Layers,
    title: 'Physics Shadows',
    desc: 'Real-time shadow rendering based on geometry.',
  },
  {
    icon: Box,
    title: 'Asset Engine',
    desc: 'Manage product bases and brand kits in the cloud.',
  },
  {
    icon: MonitorPlay,
    title: 'Skia Canvas',
    desc: '120fps hardware-accelerated manipulation.',
  },
  {
    icon: Cpu,
    title: 'Edge Processing',
    desc: 'Secure Deno Edge Functions proxying ML models.',
  },
  {
    icon: DownloadCloud,
    title: '4x Upscaling',
    desc: 'Export production-ready, high-resolution 4K files.',
  },
];

export default function NorthStudioLogin() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const updateForm = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert(
        'Access Required',
        'Please enter your studio access keys.',
      );
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/dashboard');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Access Denied', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Kills Web Autofill UI overriding the custom theme */}
      {Platform.OS === 'web' && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #0A0D14 inset !important;
            -webkit-text-fill-color: white !important;
          }
        `,
          }}
        />
      )}

      <LinearGradient
        colors={[NORTH_THEME.colors.background.primary, '#0F0815', '#050A14']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {isDesktop ? (
            <View style={styles.desktopContainer}>
              <Animated.View
                entering={FadeInRight.duration(800).springify()}
                style={styles.desktopSidebar}
              >
                <LoginFormContent
                  form={form}
                  loading={loading}
                  updateForm={updateForm}
                  onLogin={handleLogin}
                />
              </Animated.View>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <MarketingContent isDesktop={true} />
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContentMobile}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.mobilePane}>
                <LoginFormContent
                  form={form}
                  loading={loading}
                  updateForm={updateForm}
                  onLogin={handleLogin}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.mobilePane}>
                <MarketingContent isDesktop={false} />
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// --- MODULE: LOGIN FORM COMPONENT ---
const LoginFormContent = memo(({ form, loading, updateForm, onLogin }: any) => {
  const [showPassword, setShowPassword] = useState(false);

  // Reanimated Physics for Brand Icon
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const handleIconInteraction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    iconRotate.value = withSequence(
      withTiming(15, { duration: 80 }),
      withTiming(-15, { duration: 80 }),
      withTiming(0, { duration: 120 }),
    );
  };

  return (
    <View style={styles.formContentWrapper}>
      <Animated.View
        entering={FadeInDown.duration(800).springify()}
        style={styles.brandHeader}
      >
        <Pressable
          onPressIn={() => (iconScale.value = withSpring(1.1))}
          onPressOut={() => (iconScale.value = withSpring(1))}
          onPress={handleIconInteraction}
        >
          <Animated.View style={[styles.brandIconBox, animatedIconStyle]}>
            <Image
              source={APP_ICON}
              style={styles.appIconImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Pressable>
        <Text style={styles.brandTitle}>North Studio</Text>
        <Text style={styles.brandSubtitle}>Welcome back to the workspace</Text>
      </Animated.View>

      <GlassCard intensity="heavy" style={styles.formCard}>
        <View style={{ gap: 24 }}>
          <View>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={NORTH_THEME.colors.text.secondary} />
              <TextInput
                style={styles.textInput}
                placeholder="creator@north.studio"
                placeholderTextColor={NORTH_THEME.colors.text.muted}
                value={form.email}
                autoComplete="off"
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(v) => updateForm('email', v)}
              />
            </View>
          </View>

          <View>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Security Token</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Lock size={16} color={NORTH_THEME.colors.text.secondary} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="off"
                placeholderTextColor={NORTH_THEME.colors.text.muted}
                value={form.password}
                onChangeText={(v) => updateForm('password', v)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={18} color="#94A3B8" />
                ) : (
                  <Eye size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={onLogin}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitButtonText}>Authorize Access</Text>
                <ChevronRight size={18} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>New Creator?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Initialize Profile</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </GlassCard>
    </View>
  );
});

// --- MODULE: MARKETING CONTENT COMPONENT ---
const MarketingContent = memo(({ isDesktop }: { isDesktop: boolean }) => (
  <View style={styles.marketingContainer}>
    <Animated.View
      entering={FadeInRight.duration(1000).delay(200).springify()}
      style={styles.heroHeader}
    >
      <View style={styles.heroBadge}>
        <Sparkles size={14} color={NORTH_THEME.colors.accent.cyan} />
        <Text style={styles.heroBadgeText}>CORE ENGINE CONNECTED</Text>
      </View>
      <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
        Accelerate {'\n'}
        <Text style={{ color: NORTH_THEME.colors.accent.cyan }}>
          Your Workflow.
        </Text>
      </Text>
      <Text style={[styles.heroDesc, !isDesktop && styles.heroDescMobile]}>
        Log in to access your cloud-synced brand kits and continue your
        high-resolution mockup generations.
      </Text>
    </Animated.View>
    <BentoGrid items={BENTO_ITEMS} isDesktop={isDesktop} />
  </View>
));

// --- GLOBAL STYLESHEET ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NORTH_THEME.colors.background.primary },
  desktopContainer: { flex: 1, flexDirection: 'row' },
  desktopSidebar: {
    width: '40%',
    height: '100%',
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
    borderRightWidth: 1,
    borderRightColor: NORTH_THEME.colors.border.glass,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 100, paddingBottom: 200 },
  scrollContentMobile: { flexGrow: 1, paddingBottom: 100 },
  mobilePane: { padding: 24, paddingTop: 60 },
  divider: {
    height: 1,
    backgroundColor: NORTH_THEME.colors.border.glass,
    marginVertical: 40,
    marginHorizontal: 24,
  },
  formContentWrapper: { width: '100%', maxWidth: 420 },
  brandHeader: { alignItems: 'center', marginBottom: 40 },
  brandIconBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(176, 38, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appIconImage: { width: 44, height: 44 },
  brandTitle: {
    color: NORTH_THEME.colors.text.primary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandSubtitle: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 15,
    marginTop: 6,
  },
  formCard: {
    padding: 36,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.border.glass,
  },
  label: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrapper: {
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.border.glass,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  textInput: {
    flex: 1,
    color: NORTH_THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    height: '100%',
  },
  submitButton: {
    height: 64,
    backgroundColor: NORTH_THEME.colors.accent.purple,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerLabel: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  footerLink: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 15,
    fontWeight: '800',
  },
  marketingContainer: { width: '100%' },
  heroHeader: { marginBottom: 40 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    gap: 8,
    marginBottom: 24,
  },
  heroBadgeText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: NORTH_THEME.colors.text.primary,
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 68,
    letterSpacing: -2,
  },
  heroTitleMobile: { fontSize: 40, lineHeight: 46 },
  heroDesc: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 18,
    lineHeight: 30,
    marginTop: 16,
    maxWidth: 640,
    fontWeight: '500',
  },
  heroDescMobile: { fontSize: 16, lineHeight: 28 },
});

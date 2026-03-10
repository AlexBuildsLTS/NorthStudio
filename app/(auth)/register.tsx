/**
 * @file app/(auth)/register.tsx
 * @description AAA+ Standard Registration Gateway.
 * Features strict validation, interactive Reanimated physics, and CSS Web Autofill fixes.
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
  User,
  Mail,
  Lock,
  ShieldCheck,
  Wand2,
  Layers,
  Box,
  MonitorPlay,
  Cpu,
  DownloadCloud,
  Check,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
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
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { BentoGrid } from '@/components/bento/BentoGrid';
import { NORTH_THEME } from '@/constants/theme';

const APP_ICON = require('@/assets/images/icon.png');

const BENTO_ITEMS = [
  {
    icon: Wand2,
    title: 'AI Compositing',
    desc: 'Neural blending for realistic mockup textures.',
  },
  {
    icon: Layers,
    title: 'Physics Shadows',
    desc: 'Real-time ray-traced shadow rendering.',
  },
  {
    icon: Box,
    title: 'Asset Engine',
    desc: 'Centralized cloud management for brand kits.',
  },
  {
    icon: MonitorPlay,
    title: 'Skia Canvas',
    desc: '120fps hardware manipulation engine.',
  },
  {
    icon: Cpu,
    title: 'Edge Processing',
    desc: 'Secure Deno Edge Functions proxying ML models.',
  },
  {
    icon: DownloadCloud,
    title: '4x Upscaling',
    desc: 'Export production-ready high-res files.',
  },
];

export default function NorthStudioRegister() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });
  const [loading, setLoading] = useState(false);

  const updateForm = useCallback((key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRegister = async () => {
    const { username, fullName, email, password, confirmPassword, agreed } =
      form;

    if (!username || !fullName || !email || !password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert(
        'Missing Data',
        'All fields are required to initialize a studio.',
      );
    }
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert(
        'Security Validation',
        'Password tokens do not match.',
      );
    }
    if (!agreed) {
      return Alert.alert(
        'Protocol Enforcement',
        'You must accept the Studio Protocol.',
      );
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
          },
        },
      });
      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Studio Initialized',
        'Your profile is ready. Proceed to login.',
        [{ text: 'Launch Studio', onPress: () => router.replace('/login') }],
      );
    } catch (e: any) {
      Alert.alert('Initialization Failed', e.message);
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
        colors={['#0A0D14', '#0F0815', '#050A14']}
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
                <RegisterFormContent
                  form={form}
                  loading={loading}
                  updateForm={updateForm}
                  onRegister={handleRegister}
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
                <RegisterFormContent
                  form={form}
                  loading={loading}
                  updateForm={updateForm}
                  onRegister={handleRegister}
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

// --- MODULE: REGISTER FORM COMPONENT ---
const RegisterFormContent = memo(
  ({ form, loading, updateForm, onRegister }: any) => {
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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

    const passwordsMatch =
      form.password === form.confirmPassword && form.password.length > 0;

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
          <Text style={styles.brandSubtitle}>Initialize creator profile</Text>
        </Animated.View>

        <GlassCard intensity="heavy" style={styles.formCard}>
          <View style={{ gap: 20 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.atSymbol}>@</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="username"
                    placeholderTextColor="#4B5563"
                    value={form.username}
                    autoComplete="off"
                    autoCapitalize="none"
                    onChangeText={(v) => updateForm('username', v)}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Creative Identity</Text>
                <View style={styles.inputWrapper}>
                  <User size={14} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#4B5563"
                    value={form.fullName}
                    autoComplete="off"
                    onChangeText={(v) => updateForm('fullName', v)}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={14} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  placeholder="hello@north.studio"
                  autoComplete="off"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(v) => updateForm('email', v)}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Create Token</Text>
              <View style={styles.inputWrapper}>
                <Lock size={14} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPass}
                  placeholder="••••••••"
                  autoComplete="off"
                  value={form.password}
                  onChangeText={(v) => updateForm('password', v)}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  {showPass ? (
                    <EyeOff size={16} color="#94A3B8" />
                  ) : (
                    <Eye size={16} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
              <PasswordStrengthIndicator password={form.password} />
            </View>

            <View>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Confirm Token</Text>
                {passwordsMatch && (
                  <View style={styles.matchBadge}>
                    <Check size={10} color="#22C55E" strokeWidth={3} />
                    <Text style={styles.matchText}>MATCHED</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  form.confirmPassword.length > 0 &&
                    !passwordsMatch && { borderColor: '#EF4444' },
                ]}
              >
                <ShieldCheck size={14} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showConfirm}
                  placeholder="••••••••"
                  autoComplete="off"
                  value={form.confirmPassword}
                  onChangeText={(v) => updateForm('confirmPassword', v)}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? (
                    <EyeOff size={16} color="#94A3B8" />
                  ) : (
                    <Eye size={16} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.agreedContainer}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateForm('agreed', !form.agreed);
              }}
            >
              <View
                style={[
                  styles.checkboxBase,
                  form.agreed && styles.checkboxActive,
                ]}
              >
                {form.agreed && (
                  <Check size={14} color="#FFF" strokeWidth={3} />
                )}
              </View>
              <Text style={styles.agreedText}>
                I confirm the{' '}
                <Text style={{ color: '#00F0FF', fontWeight: 'bold' }}>
                  Studio Protocol
                </Text>{' '}
                and Privacy Policy.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onRegister}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.btnText}>Initialize Studio</Text>
                  <ChevronRight size={18} color="#FFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Existing Creator?</Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  },
);

// --- MODULE: MARKETING CONTENT COMPONENT ---
const MarketingContent = memo(({ isDesktop }: { isDesktop: boolean }) => (
  <View style={styles.marketingContainer}>
    <Animated.View
      entering={FadeInRight.duration(1000).delay(200).springify()}
      style={styles.heroHeader}
    >
      <View style={styles.heroBadge}>
        <Sparkles size={14} color="#00F0FF" />
        <Text style={styles.heroBadgeText}>INDUSTRY STANDARD 2026</Text>
      </View>
      <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
        Next-Gen {'\n'}
        <Text style={{ color: '#00F0FF' }}>Mockup Rendering.</Text>
      </Text>
      <Text style={[styles.heroDesc, !isDesktop && styles.heroDescMobile]}>
        Leverage our multi-modal AI engine to transform flat vectors into
        hyper-realistic product photography. Built on Skia.
      </Text>
    </Animated.View>
    <BentoGrid items={BENTO_ITEMS} isDesktop={isDesktop} />
  </View>
));

// --- GLOBAL STYLESHEET ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0D14' },
  desktopContainer: { flex: 1, flexDirection: 'row' },
  desktopSidebar: {
    width: '40%',
    height: '100%',
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 80, paddingBottom: 150 },
  scrollContentMobile: { flexGrow: 1, paddingBottom: 100 },
  mobilePane: { padding: 24, paddingTop: 40 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 40,
    marginHorizontal: 24,
  },
  formContentWrapper: { width: '100%', maxWidth: 460 },
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
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandSubtitle: { color: '#94A3B8', fontSize: 15, marginTop: 4 },
  formCard: {
    padding: 36,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: { flexDirection: 'row', gap: 16 },
  label: {
    color: '#00F0FF',
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
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  atSymbol: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    height: '100%',
    marginLeft: 8,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  matchText: { color: '#22C55E', fontSize: 9, fontWeight: '900' },
  agreedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 14,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#B026FF', borderColor: '#B026FF' },
  agreedText: { color: '#94A3B8', fontSize: 14, flex: 1 },
  submitBtn: {
    height: 64,
    backgroundColor: '#B026FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerLabel: { color: '#64748B', fontSize: 15 },
  footerLink: { color: '#00F0FF', fontSize: 15, fontWeight: '800' },
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
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 68,
    letterSpacing: -2,
  },
  heroTitleMobile: { fontSize: 40, lineHeight: 46 },
  heroDesc: {
    color: '#94A3B8',
    fontSize: 18,
    lineHeight: 30,
    marginTop: 16,
    maxWidth: 640,
    fontWeight: '500',
  },
  heroDescMobile: { fontSize: 16, lineHeight: 28 },
});

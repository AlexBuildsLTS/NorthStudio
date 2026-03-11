/**
 * @file app/(auth)/login.tsx
 * @description AAA+ Standard Authentication Gateway.
 * Features Username/Email SQL resolution, Inline Animated Error/Success Banners,
 * form-shake feedback, and fully functional password recovery.
 */

import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
  BrainCircuit,
  Check,
  User,
  AlertCircle,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/ui/GlassCard';
import { BentoGrid } from '@/components/bento/BentoGrid';

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

export default function NorthStudioLogin() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Custom Inline Banner States (Replaces clunky Alert.alert)
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const updateForm = useCallback(
    (key: string, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear errors when user starts typing again
      if (errorMsg) setErrorMsg('');
      if (infoMsg) setInfoMsg('');
    },
    [errorMsg, infoMsg],
  );

  // Shared values for Shake Animation
  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  // Smooth Error Trigger
  const triggerError = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setInfoMsg('');
    setErrorMsg(msg);

    // Physically shake the form
    shakeOffset.value = withSequence(
      withTiming(12, { duration: 50 }),
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  // FULLY FUNCTIONAL PASSWORD RECOVERY
  const handleForgotPassword = async () => {
    if (!form.identifier) {
      return triggerError(
        'Please enter your username or email above to reset your password.',
      );
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      let resetEmail = form.identifier.trim().toLowerCase();

      // Resolve username to email if necessary
      if (!resetEmail.includes('@') || !resetEmail.includes('.')) {
        const cleanUsername = resetEmail.replace(/^@/, '');
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          'get_user_email_by_username',
          { lookup_username: cleanUsername },
        );

        if (rpcError || !resolvedEmail) {
          throw new Error('Account does not exist.');
        }
        resetEmail = resolvedEmail;
      }

      // Trigger Actual Supabase Password Reset
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setInfoMsg('Recovery email sent! Please check your inbox.');
    } catch (e: any) {
      triggerError(
        e.message === 'Account does not exist.'
          ? e.message
          : 'Failed to send recovery email.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!form.identifier || !form.password) {
      return triggerError('Please enter your username/email and password.');
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      let loginEmail = form.identifier.trim().toLowerCase();

      // Secure SQL Resolution: If no '@', resolve username via our Supabase RPC function
      if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
        const cleanUsername = loginEmail.replace(/^@/, '');

        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          'get_user_email_by_username',
          { lookup_username: cleanUsername },
        );

        if (rpcError || !resolvedEmail) {
          throw new Error('Account does not exist or password is incorrect.');
        }

        loginEmail = resolvedEmail;
      }

      // Execute Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: form.password,
      });

      if (authError) throw authError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Trigger the fluid UI success transition
      setIsSuccess(true);

      // Wait exactly 2.5 seconds for the user to see the success state, then seamlessly auto-route
      setTimeout(() => {
        router.replace('/(app)/dashboard');
      }, 2500);
    } catch (e: any) {
      setLoading(false);

      let parsedError = e.message;
      if (parsedError.includes('Invalid login credentials')) {
        parsedError = 'Account does not exist or password is incorrect.';
      }

      triggerError(parsedError);
    }
  };

  return (
    <View style={styles.root}>
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
                <ScrollView
                  contentContainerStyle={styles.sidebarScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Animated.View style={shakeStyle}>
                    <LoginFormContent
                      form={form}
                      loading={loading}
                      isSuccess={isSuccess}
                      updateForm={updateForm}
                      onLogin={handleLogin}
                      onForgot={handleForgotPassword}
                      errorMsg={errorMsg}
                      infoMsg={infoMsg}
                    />
                  </Animated.View>
                </ScrollView>
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
                <Animated.View
                  style={[{ width: '100%', alignItems: 'center' }, shakeStyle]}
                >
                  <LoginFormContent
                    form={form}
                    loading={loading}
                    isSuccess={isSuccess}
                    updateForm={updateForm}
                    onLogin={handleLogin}
                    onForgot={handleForgotPassword}
                    errorMsg={errorMsg}
                    infoMsg={infoMsg}
                  />
                </Animated.View>
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

const LoginFormContent = memo(
  ({
    form,
    loading,
    isSuccess,
    updateForm,
    onLogin,
    onForgot,
    errorMsg,
    infoMsg,
  }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const iconScale = useSharedValue(1);
    const iconRotate = useSharedValue(0);

    const animatedIconStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: iconScale.value },
        { rotate: `${iconRotate.value}deg` },
      ],
    }));

    const handleIconInteraction = () => {
      if (isSuccess) return;
      if (Platform.OS !== 'web')
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Layers size={14} color="#00F0FF" />
            <Text style={styles.headerBadgeText}>
              {isSuccess ? 'Connection Established' : 'Access Your Studio'}
            </Text>
          </View>
        </Animated.View>

        <GlassCard intensity="heavy" style={styles.formCard}>
          {!isSuccess ? (
            <Animated.View
              exiting={FadeOutLeft.duration(300)}
              layout={LinearTransition.springify()}
            >
              <View style={{ gap: 20 }}>
                {/* INLINE ERROR BANNER - Renders securely inside the card flow */}
                {errorMsg ? (
                  <Animated.View
                    entering={FadeInUp}
                    exiting={FadeOutUp}
                    style={styles.inlineErrorBanner}
                  >
                    <AlertCircle size={16} color="#FF3366" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </Animated.View>
                ) : null}

                {/* INLINE INFO BANNER - For successful password resets */}
                {infoMsg ? (
                  <Animated.View
                    entering={FadeInUp}
                    exiting={FadeOutUp}
                    style={styles.inlineInfoBanner}
                  >
                    <Check size={16} color="#22C55E" />
                    <Text style={styles.infoText}>{infoMsg}</Text>
                  </Animated.View>
                ) : null}

                <View>
                  <Text style={styles.label}>Username or Email</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput as any} // Cast safely for web outlineStyle
                      placeholder="@username or email"
                      placeholderTextColor="#4B5563"
                      value={form.identifier}
                      autoComplete="off"
                      autoCapitalize="none"
                      onChangeText={(v) => updateForm('identifier', v)}
                    />
                  </View>
                </View>

                <View>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    {/* FUNCTIONAL Forgot Password Trigger */}
                    <TouchableOpacity onPress={onForgot} disabled={loading}>
                      <Text style={styles.forgotText}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput as any}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      autoComplete="off"
                      placeholderTextColor="#4B5563"
                      value={form.password}
                      onChangeText={(v) => updateForm('password', v)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
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
                      <Text style={styles.submitButtonText}>Sign In</Text>
                      <ChevronRight size={18} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>New Creator?</Text>
                  <Link href="/register" asChild>
                    <TouchableOpacity>
                      <Text style={styles.footerLink}>Create Profile</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInRight.duration(400).delay(200)}
              style={styles.successStateContainer}
            >
              <Animated.View
                entering={ZoomIn.duration(600).springify().delay(400)}
                style={styles.successIconPulse}
              >
                <Check size={48} color="#00F0FF" strokeWidth={3} />
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.duration(400).delay(600)}
                style={styles.successTitle}
              >
                Authentication Verified
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.duration(400).delay(750)}
                style={styles.successDesc}
              >
                Routing to the dashboard engine...
              </Animated.Text>
              <Animated.View entering={FadeInDown.duration(400).delay(900)}>
                <ActivityIndicator
                  size="small"
                  color="#00F0FF"
                  style={{ marginTop: 30 }}
                />
              </Animated.View>
            </Animated.View>
          )}
        </GlassCard>
      </View>
    );
  },
);

const MarketingContent = memo(({ isDesktop }: { isDesktop: boolean }) => (
  <View style={styles.marketingContainer}>
    <Animated.View entering={FadeInRight.duration(1000).delay(200).springify()}>
      <GlassCard
        intensity="heavy"
        style={[styles.heroCardBento, !isDesktop && styles.heroCardBentoMobile]}
      >
        <View style={styles.heroBadge}>
          <BrainCircuit size={16} color="#00F0FF" />
          <Text style={styles.heroBadgeText}>North Studio Engine</Text>
        </View>
        <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
          Accelerate {'\n'}
          <Text style={{ color: '#00F0FF' }}>Your Workflow</Text>
        </Text>
        <Text style={[styles.heroDesc, !isDesktop && styles.heroDescMobile]}>
          North Studio transforms flat vectors into highly accurate, 3D
          composited merchandise mockups. Built securely on the Skia Engine, our
          platform handles real-time physics mapping, ray-traced shadow
          geometry, and intelligent fabric blending.
        </Text>
      </GlassCard>
    </Animated.View>
    <BentoGrid items={BENTO_ITEMS} isDesktop={isDesktop} />
  </View>
));

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0D14' },
  desktopContainer: { flex: 1, flexDirection: 'row' },
  desktopSidebar: {
    width: '40%',
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  sidebarScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 80, paddingBottom: 150 },
  scrollContentMobile: { flexGrow: 1, paddingBottom: 100 },
  mobilePane: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    width: '100%',
  },
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
  headerBadgeText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formCard: {
    padding: 36,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 380,
    justifyContent: 'center',
  },

  // Secure Inline Banner Styles
  inlineErrorBanner: {
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.4)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#FF3366',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  inlineInfoBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },

  successStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  successIconPulse: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  successTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  successDesc: { color: '#94A3B8', fontSize: 15 },
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
    marginBottom: 10,
    marginLeft: 4,
    marginRight: 4,
  },
  forgotText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
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

  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    height: '100%',
  },

  submitButton: {
    height: 64,
    backgroundColor: '#B026FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerLabel: { color: '#64748B', fontSize: 15, fontWeight: '500' },
  footerLink: { color: '#00F0FF', fontSize: 15, fontWeight: '800' },
  marketingContainer: { width: '100%', maxWidth: 1200, alignSelf: 'center' },
  heroCardBento: {
    padding: 40,
    borderRadius: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  heroCardBentoMobile: { padding: 24, borderRadius: 24 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    gap: 8,
    marginBottom: 24,
  },
  heroBadgeText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 60,
    letterSpacing: -1.5,
  },
  heroTitleMobile: { fontSize: 36, lineHeight: 42 },
  heroDesc: {
    color: '#E2E8F0',
    fontSize: 17,
    lineHeight: 28,
    marginTop: 20,
    maxWidth: 680,
    fontWeight: '500',
  },
  heroDescMobile: { fontSize: 15, lineHeight: 24 },
});

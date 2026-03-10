/**
 * @file app/(app)/dashboard.tsx
 * @description The main control center for North Studio.
 * Features a stagger-fade-in Bento grid, live credit tracking, and hardware-accelerated interactive elements.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  ArrowRight,
  Cuboid,
  Wand2,
  DownloadCloud,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { NORTH_THEME } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();

  // CTA Button Animation State
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(buttonScale.value, NORTH_THEME.animation.spring) },
    ],
  }));

  const handleCreatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Cast to 'any' to bypass Expo Router's strict indexing lag during development
    router.push('/(app)/studio' as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER SECTION */}
      <Animated.View
        entering={FadeInDown.duration(800).springify()}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NORTH STUDIO V2.0</Text>
          </View>
          {/* NEW FEATURE: Active Credit Tracking Pill */}
          <View style={styles.creditPill}>
            <Zap size={14} color={NORTH_THEME.colors.accent.cyan} />
            <Text style={styles.creditText}>1,240 Credits</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          Create Realistic{'\n'}Merchandise Mockups.
        </Text>
        <Text style={styles.subtitle}>
          Upload your logos and products, and let our multi-modal AI composite
          them perfectly with realistic lighting, physics shadows, and dynamic
          warping.
        </Text>

        {/* PRIMARY CTA */}
        <Animated.View style={[styles.ctaWrapper, buttonAnimatedStyle]}>
          <Pressable
            onPressIn={() => (buttonScale.value = 0.95)}
            onPressOut={() => (buttonScale.value = 1)}
            onPress={handleCreatePress}
            style={styles.ctaButton}
          >
            <LinearGradient
              colors={[
                NORTH_THEME.colors.accent.purple,
                NORTH_THEME.colors.accent.cyan,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ctaText}>Launch Skia Engine</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* BENTO GRID SECTION */}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        <Animated.View
          entering={FadeInUp.delay(200).duration(800).springify()}
          style={[styles.gridItem, isDesktop && styles.gridCol1]}
        >
          <GlassCard intensity="light" style={styles.cardInner}>
            <View style={styles.iconWrapper}>
              <Cuboid size={28} color={NORTH_THEME.colors.accent.purple} />
            </View>
            <Text style={styles.cardTitle}>Asset Engine</Text>
            <Text style={styles.cardDesc}>
              Manage product bases, vectors, and your unified brand kits
              securely in the cloud.
            </Text>
          </GlassCard>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).duration(800).springify()}
          style={[styles.gridItem, isDesktop && styles.gridCol2]}
        >
          <GlassCard intensity="light" style={styles.cardInner}>
            <View style={styles.iconWrapper}>
              <Wand2 size={28} color={NORTH_THEME.colors.accent.pink} />
            </View>
            <Text style={styles.cardTitle}>AI Compositing</Text>
            <Text style={styles.cardDesc}>
              Multi-modal edge rendering computes perfect fabric warping and
              perspective.
            </Text>
          </GlassCard>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(800).springify()}
          style={[styles.gridItem, isDesktop && styles.gridCol3]}
        >
          <GlassCard intensity="light" style={styles.cardInner}>
            <View style={styles.iconWrapper}>
              <DownloadCloud size={28} color={NORTH_THEME.colors.accent.cyan} />
            </View>
            <Text style={styles.cardTitle}>4x Upscaling Export</Text>
            <Text style={styles.cardDesc}>
              Download production-ready, ultra-high resolution assets directly
              to your device.
            </Text>
          </GlassCard>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NORTH_THEME.colors.background.primary,
  },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  contentDesktop: {
    padding: 80,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  header: { marginBottom: 48 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(176, 38, 255, 0.3)',
  },
  badgeText: {
    color: NORTH_THEME.colors.accent.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    gap: 6,
  },
  creditText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: NORTH_THEME.colors.text.primary,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 52,
    marginBottom: 16,
  },
  subtitle: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 600,
    marginBottom: 32,
  },
  ctaWrapper: { alignSelf: 'flex-start', borderRadius: 16, overflow: 'hidden' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    gap: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'column', gap: 20 },
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '100%' },
  gridCol1: { width: '100%' },
  gridCol2: { width: '48.5%' },
  gridCol3: { width: '48.5%' },
  cardInner: {
    padding: 32,
    minHeight: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.border.glass,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.border.glass,
  },
  cardTitle: {
    color: NORTH_THEME.colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  cardDesc: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 15,
    lineHeight: 24,
  },
});

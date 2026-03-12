/**
 * @file components/navigation/Sidebar.tsx
 * @description AAA+ Cosmic Glass Sidebar.
 * FIXES: Removed flat black backgrounds. Added deep transparency and gradient overlays
 * to match the cosmic vision board. Gated BlurView to prevent Android APK crashes.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  Layout,
  Box,
  Wand2,
  History,
  ChevronLeft,
  Menu,
  Dna,
  ArrowBigLeftDash,
  Vault,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { NORTH_THEME } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/(app)/dashboard', icon: Layout },
  { name: 'Asset Vault', path: '/(app)/vault', icon: Vault },
  { name: 'Studio Engine', path: '/(app)/studio', icon: Wand2 },
  { name: 'Gallery', path: '/(app)/gallery', icon: History },
];

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const sidebarWidth = useSharedValue(260);
  const textOpacity = useSharedValue(1);

  const toggleSidebar = () => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    sidebarWidth.value = withSpring(nextExpanded ? 260 : 85, {
      damping: 20,
      stiffness: 180,
    });
    textOpacity.value = withTiming(nextExpanded ? 1 : 0, { duration: 150 });
  };

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedSidebarStyle]}>
      {/* OS-Safe Glass Background */}
      {(Platform.OS === 'ios' || Platform.OS === 'web') && (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['rgba(2, 1, 10, 0.4)', 'rgba(13, 2, 33, 0.6)']}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={styles.header}>
        {isExpanded && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.brandRow}
          >
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>
              NORTH
              <Text style={{ color: NORTH_THEME.colors.accent.cyan }}>
                STUDIO
              </Text>
            </Text>
          </Animated.View>
        )}
        <TouchableOpacity onPress={toggleSidebar} style={styles.toggleBtn}>
          {isExpanded ? (
            <ArrowBigLeftDash size={18} color="#94A3B8" />
          ) : (
            <Menu size={18} color="#94A3B8" />
          )}
        </TouchableOpacity>
      </View>

      {/* NAVIGATION RAIL */}
      <View style={styles.navContainer}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.includes(item.path.replace('/(app)', ''));
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.path}
              activeOpacity={0.8}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                !isExpanded && {
                  justifyContent: 'center',
                  paddingHorizontal: 0,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push(item.path as any);
              }}
            >
              {/* Active Background Glow */}
              {isActive && (
                <LinearGradient
                  colors={[
                    'rgba(0, 240, 255, 0.1)',
                    'rgba(176, 38, 255, 0.05)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}

              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <Icon
                  size={20}
                  color={isActive ? '#FFF' : '#94A3B8'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>

              {isExpanded && (
                <Animated.View style={[styles.textWrapper, animatedTextStyle]}>
                  <Text
                    style={[styles.navText, isActive && styles.navTextActive]}
                  >
                    {item.name}
                  </Text>
                  {isActive && <View style={styles.glowIndicator} />}
                </Animated.View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Dna size={24} color={NORTH_THEME.colors.accent.cyan} />
        {isExpanded && (
          <Animated.Text entering={FadeIn} style={styles.engineText}>
            CORE ENGINE ONLINE
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    zIndex: 10,
    overflow: 'hidden',
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NORTH_THEME.colors.accent.purple,
    shadowColor: NORTH_THEME.colors.accent.purple,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  brandText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navContainer: { marginTop: 30, paddingHorizontal: 16, gap: 12 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: { borderColor: 'rgba(0, 240, 255, 0.2)' },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: NORTH_THEME.colors.accent.purple,
    borderRadius: 12,
  },
  textWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  navTextActive: { color: '#FFF', fontWeight: '900' },
  glowIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowRadius: 6,
    shadowOpacity: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  engineText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 12,
    letterSpacing: 1.5,
    opacity: 0.8,
  },
});

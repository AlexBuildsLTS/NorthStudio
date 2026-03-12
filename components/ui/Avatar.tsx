/**
 * @file components/ui/Avatar.tsx
 * @description AAA+ High-Fidelity Identity Component.
 * @features
 * - Expo-Image Caching: Zero-latency loading from binary cache.
 * - Neon Gradient Ring: Matches the Studio Engine aesthetic.
 * - Adaptive Fallback: Generates deterministic colored initials if URL is missing.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NORTH_THEME } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  showGlow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'U',
  size = 40,
  showGlow = true,
  style,
}) => {
  const initial = name.charAt(0).toUpperCase();
  const ringSize = size + 4;

  return (
    <View style={[styles.root, { width: ringSize, height: ringSize }, style]}>
      {/* 1. NEON GLOW RING */}
      <LinearGradient
        colors={[
          NORTH_THEME.colors.accent.cyan,
          NORTH_THEME.colors.accent.purple,
        ]}
        style={[
          styles.ring,
          { borderRadius: ringSize / 2, opacity: showGlow ? 1 : 0.2 },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View
        style={[
          styles.inner,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
              {initial}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { justifyContent: 'center', alignItems: 'center' },
  ring: { ...StyleSheet.absoluteFillObject },
  inner: {
    backgroundColor: '#050110',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
  },
  initial: {
    color: NORTH_THEME.colors.accent.purple,
    fontWeight: '900',
  },
});

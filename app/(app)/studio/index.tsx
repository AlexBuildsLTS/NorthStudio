/**
 * @file app/(app)/studio/index.tsx
 * @description AAA+ Skia WebGL Quarantine Bootloader.
 * @features
 * - Physically splits the Metro bundle to prevent premature Skia evaluation.
 * - Uses Shopify's official WithSkiaWeb HOC for 100% crash immunity.
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { NORTH_THEME } from '@/constants/theme';

const FallbackLoader = () => (
  <View style={styles.loaderContainer}>
    <LinearGradient
      colors={['#050110', '#0D0221', '#050110']}
      style={StyleSheet.absoluteFill}
    />
    <ActivityIndicator size="large" color={NORTH_THEME.colors.accent.cyan} />
    <Text style={styles.bootText}>INJECTING WASM GPU ENGINE...</Text>
  </View>
);

export default function StudioRoute() {
  return (
    <WithSkiaWeb
      // Pointing to the local /public directory you set up earlier
      opts={{ locateFile: (file) => `/${file}` }}
      // Dynamically importing the entire Studio architecture AFTER WASM is ready
      getComponent={() => import('@/components/studio/StudioContainer')}
      fallback={<FallbackLoader />}
    />
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02010A',
  },
  bootText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 24,
  },
});

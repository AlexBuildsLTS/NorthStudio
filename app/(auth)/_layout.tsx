/**
 * @file app/(auth)/_layout.tsx
 * @description Authentication Layout Controller.
 * Manages the auth navigation stack and injects the global semver shield.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

// ============================================================================
// SYSTEM SHIELD (TYPESCRIPT-SAFE)
// ============================================================================
// Uses globalThis to bypass TS environment definition errors while satisfying
// the React DevTools extension requirement for a valid semver string.
if (Platform.OS === 'web') {
  try {
    const root = globalThis as any;
    root.process = root.process || { env: {} };
    root.process.env = root.process.env || {};
    root.process.env.REACT_NATIVE_VERSION = '0.76.0';
  } catch (e) {
    console.warn('[System] Semver shim bypassed.');
  }
}

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#0A0D14' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

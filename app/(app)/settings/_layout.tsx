/**
 * @file app/(app)/settings/_layout.tsx
 * @description AAA+ Stack Controller for Settings.
 * @target Android APK & Web ONLY.
 * @features Native Stack navigation with immersive transparent headers.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { NORTH_THEME } from '@/constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: NORTH_THEME.colors.background.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 14,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: NORTH_THEME.colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      {/* Master Hub */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Sub-Routines */}
      <Stack.Screen
        name="profile"
        options={{ title: 'IDENTITY MATRIX', headerShown: false }}
      />

      <Stack.Screen
        name="change-password"
        options={{ title: 'SECURITY OVERRIDE', headerShown: false }}
      />

      <Stack.Screen
        name="biometric"
        options={{ title: 'BIOMETRICS', headerShown: false }}
      />

      <Stack.Screen
        name="[id]"
        options={{ title: 'SYSTEM TELEMETRY', headerShown: false }}
      />
    </Stack>
  );
}

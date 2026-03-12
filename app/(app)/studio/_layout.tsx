/**
 * @file app/(app)/studio/_layout.tsx
 * @description Immersive Boundary for the Studio Engine.
 * Features: Hardware Back-Button Interception, Status Bar Hiding, 120fps Fade Entrance.
 */

import React, { useEffect } from 'react';
import { BackHandler, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function StudioLayout() {
  const router = useRouter();

  // Prevent accidental exits on Android devices via hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      Alert.alert(
        'Exit Studio?',
        'Are you sure you want to leave? Unsaved changes may be lost.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ],
      );
      return true; // Prevents default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => backHandler.remove();
  }, [router]);

  return (
    <>
      {/* Total Immersion: Hide Status bar on iOS/Android while in Studio */}
      <StatusBar hidden />

      {/* Stack ensures the Studio sits on top of everything without TabBars bleeding through */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Smooth AAA entrance
          contentStyle: { backgroundColor: '#02010A' }, // Deep Obsidian
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}

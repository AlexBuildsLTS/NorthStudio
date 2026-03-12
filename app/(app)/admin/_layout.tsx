/**
 * @file app/(app)/admin/_layout.tsx
 * @description AAA+ Secure Admin Layout Router.
 * @target Android APK & Web ONLY.
 * @features
 * - Zustand-backed Role-Based Access Control (RBAC).
 * - Instant silent ejection for unauthorized entities.
 * - Deep Cosmic Space UI integration.
 * - Resolves 'admin' enum from database.types.ts strictly.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldAlert } from 'lucide-react-native';

import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { NORTH_THEME } from '@/constants/theme';

export default function AdminLayout() {
  // Pull directly from the highly-optimized Zustand stores
  const { isInitialized } = useAuthStore();
  const { profile, isLoading: isProfileLoading } = useUserStore();

  // ============================================================================
  // 1. STATE: INITIALIZATION & SECURITY VERIFICATION
  // ============================================================================
  // We must hold the UI here until Zustand fully mounts the user profile from Supabase.
  if (!isInitialized || isProfileLoading) {
    return (
      <View style={styles.loaderContainer}>
        <LinearGradient
          colors={['#050110', '#0D0221', '#050110']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loaderContent}>
          <ShieldAlert size={48} color={NORTH_THEME.colors.status.danger} />
          <ActivityIndicator
            size="large"
            color={NORTH_THEME.colors.status.danger}
            style={{ marginTop: 24 }}
          />
          <Text style={styles.loaderText}>VERIFYING CLEARANCE...</Text>
        </View>
      </View>
    );
  }

  // ============================================================================
  // 2. STATE: ENFORCEMENT (RBAC)
  // ============================================================================
  // Note: database.types.ts defines user_role as 'member' | 'premium' | 'moderator' | 'admin'
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    // Unauthorized access attempt detected.
    // Silently bounce the operator back to the main dashboard without rendering children.
    return <Redirect href="/(app)/dashboard" />;
  }

  // ============================================================================
  // 3. STATE: AUTHORIZED MOUNT
  // ============================================================================
  return (
    <View style={styles.root}>
      {/* We apply the gradient at the root so nested Stack screens can be transparent */}
      <LinearGradient
        colors={['#050110', '#0D0221', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade', // AAA+ smooth transition for restricted panels
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="users" />
      </Stack>
    </View>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050110',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050110',
  },
  loaderContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  loaderText: {
    color: NORTH_THEME.colors.status.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
  },
});

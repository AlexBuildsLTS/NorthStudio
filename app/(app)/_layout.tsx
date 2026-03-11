/**
 * @file app/(app)/_layout.tsx
 * @description The Authenticated Workspace Controller.
 * Restores your original Master Layout structure, integrating the TopBar, Sidebar, and Tabs.
 */

import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { NORTH_THEME } from '@/constants/theme';

// Stores
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';

// UI Components
import { TopBar } from '@/components/navigation/TopBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomTabBar } from '@/components/navigation/BottomTabBar';

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const router = useRouter();

  // Pull from the Zustand stores we created
  const { session, isInitialized, initialize } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Fetch the user profile (for the TopBar badges/avatar) once we have a session
  useEffect(() => {
    if (session?.user?.id && !profile) {
      fetchProfile(session.user.id);
    }
  }, [session, profile, fetchProfile]);

  // Show a dark loading screen while checking local storage
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={NORTH_THEME.colors.accent.cyan}
        />
      </View>
    );
  }

  // GATEKEEPER: If no session exists, forcefully boot the user to the login screen
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.masterLayout}>
      {/* 1. Universal Top Header (Restored to your original position) */}
      <TopBar />

      <View style={styles.contentArea}>
        {/* 2. Desktop Sidebar (Only renders on Desktop) */}
        {isDesktop && <Sidebar />}

        {/* 3. Main Canvas / Routing Area */}
        <View style={styles.mainCanvas}>
          <Tabs
            // On mobile, use the custom BottomTabBar. On desktop, hide it completely.
            tabBar={(props) => (isDesktop ? null : <BottomTabBar {...props} />)}
            screenOptions={{
              headerShown: false, // TopBar handles the header
              tabBarHideOnKeyboard: Platform.OS === 'android',
              sceneStyle: {
                backgroundColor: NORTH_THEME.colors.background.primary,
              },
            }}
          >
            <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
            <Tabs.Screen name="assets" options={{ title: 'Vault' }} />
            <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
            <Tabs.Screen name="gallery" options={{ title: 'Gallery' }} />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: NORTH_THEME.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterLayout: {
    flex: 1,
    backgroundColor: NORTH_THEME.colors.background.primary,
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  mainCanvas: {
    flex: 1,
    backgroundColor: NORTH_THEME.colors.background.primary,
    // Add bottom padding on mobile so the content doesn't get hidden behind the floating BottomBar
    paddingBottom: Platform.OS !== 'web' ? 90 : 0,
  },
});

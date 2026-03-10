/**
 * @file app/(app)/_layout.tsx
 * @description The Authenticated Workspace Controller.
 * Manages the persistent Sidebar/Header UI and enforces Auth route protection.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Redirect, Slot, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { NORTH_THEME } from '@/constants/theme';

export default function AppLayout() {
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check for an existing session in local storage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsInitializing(false);
    });

    // 2. Listen for real-time login/logout events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  // Show a dark loading screen while checking local storage
  if (isInitializing) {
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

  // If session exists, render the master UI layout
  return (
    <View style={styles.masterLayout}>
      {/* This is a placeholder for the top Header.
        It contains a logout button so you can clear your session during testing. 
      */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>North Studio Workspace</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {/* The Sidebar will go here in the next phase */}

        <View style={styles.mainCanvas}>
          {/* <Slot /> renders dashboard.tsx, studio.tsx, gallery.tsx, etc. */}
          <Slot />
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
  header: {
    height: 70,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  mainCanvas: {
    flex: 1,
  },
});

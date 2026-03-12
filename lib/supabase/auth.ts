/**
 * @file lib/supabase/auth.ts
 * @description Production-grade Authentication Orchestrator for North Studio.
 * Implements secure session destruction, role validation, and compute credit syncing.
 */

import { Alert } from 'react-native';
import { supabase } from './client';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * Sign out the current operator and nuke all local state.
 * Ensures no ghostly memory leaks remain across sessions.
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Purge Zustand memory banks immediately
    useAuthStore.getState().signOut();
    useUserStore.getState().clearProfile();
  } catch (error: any) {
    Alert.alert('Disconnection Failed', error.message);
  }
};

/**
 * Refreshes the Operator Profile in the global Zustand store.
 * CRITICAL: Call this after AI generations to sync remaining Compute Credits.
 */
export const refreshUserProfile = async () => {
  const session = useAuthStore.getState().session;
  if (session?.user?.id) {
    await useUserStore.getState().fetchProfile(session.user.id);
  }
};

/**
 * Validates if the active operator has the required RBAC clearance.
 * @param requiredRole - Minimum clearance ('member', 'premium', 'moderator', 'admin')
 */
export const hasRequiredRole = (
  requiredRole: 'member' | 'premium' | 'moderator' | 'admin',
): boolean => {
  const profile = useUserStore.getState().profile;
  if (!profile) return false;

  const roles = ['member', 'premium', 'moderator', 'admin'];
  const userRoleIndex = roles.indexOf(profile.role);
  const requiredRoleIndex = roles.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
};

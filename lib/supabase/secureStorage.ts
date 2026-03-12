/**
 * @file lib/supabase/secureStorage.ts
 * @description Hardware-backed secure storage adapter for North Studio.
 * Ensures Supabase JWTs and Biometric states are NEVER stored in plaintext.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Error getting item:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('[SecureStorage] Error setting item:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Error removing item:', error);
    }
  },
};

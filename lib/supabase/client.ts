/**
 * @file lib/supabase/client.ts
 * @description Master Supabase Client for North Studio.
 * FIX: Replaced plaintext AsyncStorage with Hardware-Backed Secure Storage.
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { secureStorage } from './secureStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or ANON_KEY.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage, // CRITICAL: Now using AES-256 / Keychain encryption
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

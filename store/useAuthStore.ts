/**
 * @file store/useAuthStore.ts
 * @description Global state for Supabase Authentication session.
 */

import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  session: Session | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitialized: false,

  initialize: async () => {
    // Fetch initial session from AsyncStorage (handled by Supabase client)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth initialization error:', error.message);
    }

    set({ session, isInitialized: true });

    // Listen for deep links, token refreshes, or sign outs
    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession });
    });
  },

  setSession: (session) => set({ session }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
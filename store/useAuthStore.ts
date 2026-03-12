/**
 * @file store/useAuthStore.ts
 * @description Zustand store for Supabase Authentication and Profile state.
 * Optimized to prevent unnecessary re-renders.
 */

import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isInitialized: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  isLoading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        set({ session, user: session.user });
        await get().fetchProfile(session.user.id);
      } else {
        set({ session: null, user: null, profile: null });
      }

      // Listen for auth changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          set({ session: newSession, user: newSession.user });
          if (_event === 'SIGNED_IN') {
            await get().fetchProfile(newSession.user.id);
          }
        } else {
          set({ session: null, user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('[AuthStore] Initialization error:', error);
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('[AuthStore] Error fetching profile:', error);
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    } catch (error) {
      console.error('[AuthStore] Sign out error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

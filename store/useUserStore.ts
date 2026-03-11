/**
 * @file store/useUserStore.ts
 * @description Manages the extended User Profile, Roles, and Credits.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  deductCredits: (amount: number) => Promise<boolean>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ profile: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  deductCredits: async (amount: number) => {
    const { profile } = get();
    if (!profile) return false;
    if (profile.credits < amount) return false;

    const newCredits = profile.credits - amount;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', profile.id);

      if (error) throw error;

      // Update local state instantly
      set({ profile: { ...profile, credits: newCredits } });
      return true;
    } catch (err: any) {
      console.error('Failed to deduct credits:', err.message);
      return false;
    }
  },

  clearProfile: () => set({ profile: null, error: null, isLoading: false }),
}));
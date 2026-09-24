import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { enqueueMutation } from '../lib/offline/db';
import type { Profile, SchoolYear } from '../types/database';

interface AppState {
  profile: Profile | null;
  activeSchoolYear: SchoolYear | null;
  loading: boolean;
  loadForUser: (userId: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  setActiveSchoolYear: (year: SchoolYear | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  activeSchoolYear: null,
  loading: true,

  loadForUser: async (userId: string) => {
    set({ loading: true });
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

    let activeSchoolYear: SchoolYear | null = null;
    if (profile?.active_school_year_id) {
      const { data: year } = await supabase
        .from('school_years')
        .select('*')
        .eq('id', profile.active_school_year_id)
        .maybeSingle();
      activeSchoolYear = year ?? null;
    }
    set({ profile: profile ?? null, activeSchoolYear, loading: false });
  },

  updateProfile: async (patch: Partial<Profile>) => {
    const current = get().profile;
    if (!current) return;
    const optimistic = { ...current, ...patch };
    set({ profile: optimistic });
    const { error } = await supabase.from('profiles').update(patch).eq('id', current.id);
    if (error) {
      await enqueueMutation({
        id: crypto.randomUUID(),
        table: 'profiles',
        type: 'update',
        payload: patch,
        matchId: current.id,
        createdAt: Date.now(),
      });
    }
  },

  setActiveSchoolYear: (year) => set({ activeSchoolYear: year }),

  reset: () => set({ profile: null, activeSchoolYear: null, loading: true }),
}));

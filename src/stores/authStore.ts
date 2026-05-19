import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getUserProfile } from '../services/supabase';
import type { UserProfile } from '../types';

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  deviceId: string;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  setUser: (user: any) => void;
  setProfile: (profile: UserProfile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      deviceId: '',
      isLoading: true,
      isInitialized: false,

      initialize: async () => {
        // Generate or retrieve device ID
        let deviceId = localStorage.getItem('inforario_device_id');
        if (!deviceId) {
          deviceId = 'dev-' + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('inforario_device_id', deviceId);
        }

        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            set({ 
              user: session.user, 
              deviceId: session.user.id,
              isLoading: false,
              isInitialized: true 
            });
            await get().fetchProfile(session.user.id);
          } else {
            set({ 
              user: null, 
              deviceId,
              isLoading: false,
              isInitialized: true 
            });
          }

          // Subscribe to auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              set({ user: session.user, deviceId: session.user.id });
              await get().fetchProfile(session.user.id);
            } else {
              const localDeviceId = localStorage.getItem('inforario_device_id') || deviceId;
              set({ user: null, profile: null, deviceId: localDeviceId });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false, isInitialized: true, deviceId });
        }
      },

      setUser: (user) => set({ user }),
      
      setProfile: (profile) => set({ profile }),

      fetchProfile: async (userId: string) => {
        try {
          const profile = await getUserProfile(userId);
          if (profile) {
            set({ profile });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        const deviceId = localStorage.getItem('inforario_device_id') || '';
        set({ user: null, profile: null, deviceId });
      },
    }),
    {
      name: 'inforario-auth',
      partialize: (state) => ({ deviceId: state.deviceId }),
    }
  )
);

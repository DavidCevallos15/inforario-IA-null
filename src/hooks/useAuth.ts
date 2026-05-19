import { useState, useEffect, useCallback } from 'react';
import { supabase, getUserProfile } from '../services/supabase';
import { AuthState, UserProfileData, createUserId } from '../types';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  state: AuthState;
  sessionUser: User | null;
  userProfile: UserProfileData | null;
  deviceId: string;
  displayName: string;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize or get device ID for guest users
  const initializeDeviceId = useCallback(() => {
    let id = localStorage.getItem('inforario_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('inforario_device_id', id);
    }
    return id;
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile as UserProfileData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (sessionUser?.id) {
      await fetchUserProfile(sessionUser.id);
    }
  }, [sessionUser?.id, fetchUserProfile]);

  // Sign out handler
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setUserProfile(null);
    setDeviceId(initializeDeviceId());
  }, [initializeDeviceId]);

  // Initialize auth state
  useEffect(() => {
    setIsLoading(true);
    
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        setDeviceId(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        setDeviceId(initializeDeviceId());
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        setDeviceId(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        setSessionUser(null);
        setUserProfile(null);
        setDeviceId(initializeDeviceId());
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeDeviceId, fetchUserProfile]);

  // Compute display name
  const displayName = 
    userProfile?.full_name ||
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.email?.split('@')[0] ||
    'estudiante';

  // Compute auth state
  const state: AuthState = isLoading
    ? { status: 'loading' }
    : sessionUser
      ? { 
          status: 'authenticated', 
          user: {
            id: createUserId(sessionUser.id),
            email: sessionUser.email || '',
            full_name: userProfile?.full_name,
            avatar_url: userProfile?.avatar_url,
            career: userProfile?.career,
          },
          profile: userProfile 
        }
      : { status: 'unauthenticated' };

  return {
    state,
    sessionUser,
    userProfile,
    deviceId,
    displayName,
    isAuthenticated: !!sessionUser,
    signOut,
    refreshProfile,
  };
}

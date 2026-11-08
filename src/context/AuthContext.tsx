'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'customer' | 'admin' | 'tour_operator';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_country_code?: string;
  phone_national_number?: string;
  nationality_code?: string;
  preferred_currency?: string;
  role: UserRole;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: 'customer',
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      // 1. Try to query public.profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
        setRole((data.role as UserRole) || 'customer');
        return;
      }
    } catch {
      // Silently continue if profiles table is not yet created
    }

    // Fallback: derive profile safely
    // NEVER trust user_metadata.role (which can be submitted by a client during registration)
    // Only app_metadata.role (set exclusively by service_role/admin) or default to 'customer'
    const userRole: UserRole =
      (currentUser.app_metadata?.role as UserRole) || 'customer';

    const fallbackProfile: UserProfile = {
      id: currentUser.id,
      email: currentUser.email || '',
      full_name:
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split('@')[0] ||
        'Traveler',
      phone_country_code: currentUser.user_metadata?.phone_country_code,
      phone_national_number: currentUser.user_metadata?.phone_national_number,
      nationality_code: currentUser.user_metadata?.country || currentUser.user_metadata?.nationality,
      role: userRole,
      created_at: currentUser.created_at,
    };

    setProfile(fallbackProfile);
    setRole(userRole);
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole('customer');
      } else {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user);
      }
    } catch (err) {
      console.error('Error fetching auth session:', err);
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole('customer');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
        setRole('customer');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshSession, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole('customer');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

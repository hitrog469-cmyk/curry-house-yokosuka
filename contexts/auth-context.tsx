'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserRole = 'customer' | 'staff' | 'admin';

interface ProfileData {
  role: UserRole;
  full_name: string;
  phone: string;
  user_id: number | null;
}

interface AuthUser extends User {
  role?: UserRole;
  full_name?: string;
  phone?: string;
  user_id?: number | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  supabaseConfigured: boolean;
  refreshUser: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if Supabase is properly configured
function checkSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  // Supabase anon keys are JWTs starting with 'eyJ' and are 200+ chars
  if (!key.startsWith('eyJ') || key.length < 100) {
    console.error('Supabase anon key appears invalid. It should be a JWT token starting with "eyJ". Current key starts with:', key.substring(0, 10) + '...');
    return false;
  }
  return true;
}

const NOT_CONFIGURED_ERROR = new Error(
  'Authentication is not configured. Please set up Supabase with valid credentials.'
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [supabaseConfigured] = useState(() => checkSupabaseConfig());
  const [supabase] = useState<SupabaseClient | null>(() => {
    if (!checkSupabaseConfig()) return null;
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  // Fetch user profile with proper error handling
  const fetchUserProfile = async (userId: string): Promise<ProfileData> => {
    const defaultProfile: ProfileData = {
      role: 'customer',
      full_name: '',
      phone: '',
      user_id: null
    };

    if (!supabase) return defaultProfile;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, phone, user_id')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error('Profile fetch error:', error.message);
        return defaultProfile;
      }

      return {
        role: (data.role as UserRole) || 'customer',
        full_name: data.full_name || '',
        phone: data.phone || '',
        user_id: data.user_id || null
      };
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return defaultProfile;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);

        setUser({
          ...session.user,
          role: profile.role,
          full_name: profile.full_name,
          phone: profile.phone,
          user_id: profile.user_id,
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Update user state with profile data
  const updateUserWithProfile = async (authUser: User) => {
    const profile = await fetchUserProfile(authUser.id);

    setUser({
      ...authUser,
      role: profile.role,
      full_name: profile.full_name,
      phone: profile.phone,
      user_id: profile.user_id,
    });
  };

  // Initialize auth
  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          await updateUserWithProfile(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        await updateUserWithProfile(session.user);
      } else {
        setUser(null);
      }

      setLoading(false);

      if (event === 'SIGNED_OUT') {
        router.push('/');
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            phone: phone || '',
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithApple = async () => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user?.role) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const value = {
    user,
    session,
    loading,
    supabaseConfigured,
    refreshUser,
    signUp,
    signInWithEmail,
    signInWithMagicLink,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

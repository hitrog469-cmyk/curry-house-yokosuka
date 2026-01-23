'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';
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
  refreshUser: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithFacebook: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch user profile with proper error handling
  const fetchUserProfile = async (userId: string): Promise<ProfileData> => {
    const defaultProfile: ProfileData = {
      role: 'customer',
      full_name: '',
      phone: '',
      user_id: null
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, phone, user_id')
        .eq('id', userId)
        .maybeSingle();

      // If error or no data, return defaults
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

      // Handle redirects
      if (event === 'SIGNED_IN') {
        router.push('/menu');
        router.refresh();
      }

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

  const signInWithGoogle = async () => {
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

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
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
    refreshUser,
    signUp,
    signInWithEmail,
    signInWithGoogle,
    signInWithFacebook,
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
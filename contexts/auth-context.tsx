'use client';

import React, { createContext, useContext } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type UserRole = 'customer' | 'staff' | 'admin';

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  full_name?: string;
  phone?: string;
  role?: UserRole;
  user_id?: number | null;
  created_at?: string;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (token: string, newPassword: string) => Promise<{ error: Error | null }>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const loading = status === 'loading';

  // Build user object from NextAuth session
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name,
        full_name: (session.user as any).full_name || session.user.name || '',
        phone: (session.user as any).phone || '',
        role: ((session.user as any).role as UserRole) || 'customer',
        user_id: (session.user as any).user_id || null,
        image: session.user.image,
      }
    : null;

  const refreshUser = async () => {
    // Trigger NextAuth session update to refetch profile data
    await update();
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Registration failed') };
      }

      // Auto sign-in after registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed — still return success
        return { error: null };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { error: new Error('Invalid email or password') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signIn('google', { callbackUrl: '/profile' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Failed to send reset email') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (token: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Failed to reset password') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user?.role) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    loading,
    refreshUser,
    signUp,
    signInWithEmail,
    signInWithGoogle,
    signOut: handleSignOut,
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

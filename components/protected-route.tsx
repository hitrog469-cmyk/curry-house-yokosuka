'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

type UserRole = 'customer' | 'staff' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect if authentication is required but user is not logged in
    if (requireAuth && !user) {
      router.push(redirectTo || '/auth/login');
      return;
    }

    // Redirect if user doesn't have the required role
    if (allowedRoles && user) {
      const hasPermission = allowedRoles.includes(user.role || 'customer');
      if (!hasPermission) {
        // Redirect based on actual role
        const roleRedirects = {
          admin: '/admin/dashboard',
          staff: '/staff/orders',
          customer: '/menu',
        };
        router.push(roleRedirects[(user.role || 'customer') as UserRole]);
      }
    }
  }, [user, loading, requireAuth, allowedRoles, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (requireAuth && !user) {
    return null;
  }

  // Don't render if user doesn't have permission
  if (allowedRoles && user && !allowedRoles.includes(user.role || 'customer')) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component version for easier use
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

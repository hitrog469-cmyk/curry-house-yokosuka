'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'magic'>('password');

  const { signInWithEmail, signInWithMagicLink, signInWithGoogle, user, loading: authLoading, supabaseConfigured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/menu';
  const authError = searchParams.get('error');

  // If user is already logged in, redirect them
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  // Show auth callback errors
  useEffect(() => {
    if (authError === 'auth_failed') {
      const errorMsg = searchParams.get('error_message');
      setError(errorMsg || 'Authentication failed. Please try again.');
    }
  }, [authError, searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (loginMode === 'magic') {
      // Magic link login (no password needed)
      const { error } = await signInWithMagicLink(email);
      if (error) {
        setError(error.message || 'Failed to send login link');
      } else {
        setSuccess('Check your email! We sent you a login link.');
      }
      setLoading(false);
      return;
    }

    // Password login
    if (!password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    const { error } = await signInWithEmail(email, password);

    if (error) {
      // Provide helpful error messages
      const msg = error.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('Wrong email or password. Try magic link login instead?');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email first. Check your inbox for a confirmation link.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🍛</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600">
            Sign in to The Curry House Yokosuka
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Supabase Config Warning */}
          {!supabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 mb-1">Authentication Setup Required</p>
              <p className="text-xs text-amber-700">
                Supabase credentials are missing or invalid. Please check your environment variables
                (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) in Vercel or .env.local.
                The anon key should be a long JWT token starting with &quot;eyJ&quot;.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Login Mode Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${loginMode === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('magic'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${loginMode === 'magic' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Email Link
            </button>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {loginMode === 'password' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {loginMode === 'magic' && (
              <p className="text-sm text-gray-500">
                We&apos;ll send a login link to your email. No password needed!
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {loginMode === 'magic' ? 'Sending link...' : 'Signing in...'}
                </span>
              ) : (
                loginMode === 'magic' ? 'Send Login Link' : 'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              onClick={() => signInWithGoogle()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-gray-700 font-medium">
                Continue with Google
              </span>
            </button>

            <button
              disabled
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed opacity-50"
            >
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-gray-400 font-medium">
                Apple — Coming soon
              </span>
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs text-green-800 text-center">
              🔒 We only collect your name & email for orders. Your data is safe with us.
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="text-green-600 hover:text-green-700 font-bold"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Guest Checkout Option */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/menu')}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center gap-2"
          >
            Continue browsing as guest
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

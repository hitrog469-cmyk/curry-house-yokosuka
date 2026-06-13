'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, CheckCircle, Loader2 } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login?verified=true'), 1800);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      await res.json();
      setInfo('A new code has been sent. Please check your inbox (and spam).');
      setResendCooldown(30);
    } catch {
      setError('Could not resend the code. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Email Verified</h2>
        <p className="text-gray-600">Your account is now active. Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {info && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700">{info}</p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
            Enter your 6-digit code
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all"
            placeholder="------"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying…
            </>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Didn&apos;t get the code?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-green-600 hover:text-green-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MailCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Verify your email</h1>
          <p className="text-gray-600">
            We sent a 6-digit verification code to your email address.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white rounded-2xl shadow-xl p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}

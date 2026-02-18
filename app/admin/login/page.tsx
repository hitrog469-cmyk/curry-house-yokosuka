'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const { signInWithEmail, user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginType, setLoginType] = useState<'admin' | 'staff'>('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If user is already logged in with correct role, redirect
  useEffect(() => {
    if (!authLoading && user?.role) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'staff') {
        router.push('/staff')
      }
    }
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await signInWithEmail(email, password)

      if (signInError) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Auth state change will trigger the useEffect above for redirect
      // But we need to wait for the profile to load and check role
      // The onAuthStateChange in auth-context will update the user with profile data
      // We'll set a timeout to check and show error if role doesn't match
      setTimeout(async () => {
        // Re-check - if still on this page after 3 seconds, role didn't match
        setLoading(false)
      }, 3000)
    } catch (err: any) {
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  // Show role mismatch error if logged in but wrong role
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin' && user.role !== 'staff') {
      setError(`Access denied. Your account has the "${user.role}" role. Only admin and staff accounts can log in here.`)
      setLoading(false)
    }
  }, [user, authLoading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/images/Logo.png"
              alt="The Curry House Yokosuka"
              className="w-20 h-20 mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {loginType === 'admin' ? 'Admin' : 'Staff'} Login
          </h1>
          <p className="text-gray-600">The Curry House Yokosuka</p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setLoginType('admin'); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              loginType === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => { setLoginType('staff'); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              loginType === 'staff'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@curryhouse.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
              loginType === 'admin'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Logging in...' : `Login as ${loginType === 'admin' ? 'Admin' : 'Staff'}`}
          </button>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
            Back to Home
          </Link>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            <strong>Note:</strong> Admin and staff accounts use the same email/password authentication as customers. Contact the administrator to have your account role upgraded.
          </p>
        </div>
      </div>
    </div>
  )
}

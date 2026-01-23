'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simple password check (in production, use proper hashing)
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    setLoading(false)

    if (fetchError || !users) {
      setError('Invalid phone number or password')
      return
    }

    // For demo: check if password matches (in production, use bcrypt)
    // Default password for all test accounts is their role + "123"
    const validPasswords: any = {
      'customer': 'customer123',
      'staff': 'staff123',
      'admin': 'admin123'
    }

    if (password !== validPasswords[users.role]) {
      setError('Invalid phone number or password')
      return
    }

    // Store user in localStorage (in production, use proper auth tokens)
    localStorage.setItem('user', JSON.stringify({
      id: users.id,
      name: users.name,
      phone: users.phone,
      role: users.role
    }))

    // Redirect based on role
    if (users.role === 'admin') {
      router.push('/admin')
    } else if (users.role === 'staff') {
      router.push('/staff')
    } else {
      router.push('/menu')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-curry-primary to-green-600 flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">The Curry House Yokosuka</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-2 text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-curry-primary focus:border-transparent"
              placeholder="0468135869"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-curry-primary focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-curry-primary hover:underline font-semibold">
            ← Back to Home
          </Link>
        </div>

        {/* Demo Accounts Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">🔑 Demo Accounts:</p>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>Admin:</strong> 0468135869 / admin123</p>
            <p><strong>Staff:</strong> 0807654321 / staff123</p>
            <p><strong>Customer:</strong> 0901234567 / customer123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
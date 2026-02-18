import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Find profile with valid token
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Check if token is expired
    if (profile.reset_token_expires && new Date(profile.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(password, 12)

    const { error } = await supabase
      .from('profiles')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

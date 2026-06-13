import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const normalizedCode = String(code).trim()

    if (!/^\d{6}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Verification is temporarily unavailable. Please try again later.' }, { status: 500 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email_verified, verification_token, verification_token_expires')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      console.error('verify-code lookup error:', error)
      return NextResponse.json({ error: 'Verification failed. Please try again later.' }, { status: 500 })
    }

    // Generic response to avoid leaking which emails exist
    if (!profile) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 })
    }

    if (profile.email_verified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    const expired =
      profile.verification_token_expires &&
      new Date(profile.verification_token_expires) < new Date()

    if (!profile.verification_token || profile.verification_token !== normalizedCode || expired) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 })
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .eq('id', profile.id)

    if (updErr) {
      console.error('verify-code update error:', updErr)
      return NextResponse.json({ error: 'Verification failed. Please try again later.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('verify-code catch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

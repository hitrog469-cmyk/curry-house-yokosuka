import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
  }

  // Find profile with this token
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, verification_token_expires')
    .eq('verification_token', token)
    .maybeSingle()

  if (error || !profile) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
  }

  // Check expiry
  if (profile.verification_token_expires && new Date(profile.verification_token_expires) < new Date()) {
    return NextResponse.redirect(new URL('/auth/login?error=token_expired', request.url))
  }

  // Mark as verified
  await supabase
    .from('profiles')
    .update({
      email_verified: true,
      verification_token: null,
      verification_token_expires: null,
    })
    .eq('id', profile.id)

  return NextResponse.redirect(new URL('/auth/login?verified=true', request.url))
}

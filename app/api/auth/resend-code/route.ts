import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'
import { sendVerificationEmail } from '@/lib/mailer'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}
const CODE_TTL_MS = 15 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || !String(email).includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again later.' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle()

    // Always return success (anti-enumeration). Only actually send if an
    // unverified account exists.
    if (profile && !profile.email_verified) {
      const code = generateCode()
      const codeExpires = new Date(Date.now() + CODE_TTL_MS).toISOString()

      await supabase
        .from('profiles')
        .update({ verification_token: code, verification_token_expires: codeExpires })
        .eq('id', profile.id)

      try {
        await sendVerificationEmail(normalizedEmail, profile.full_name || '', code)
      } catch (emailErr) {
        console.error('Resend verification email failed:', emailErr)
      }
    }

    return NextResponse.json({ success: true, message: 'If an unverified account exists, a new code has been sent.' })
  } catch (err) {
    console.error('resend-code catch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

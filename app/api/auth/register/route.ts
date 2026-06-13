import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'
import { sendVerificationEmail } from '@/lib/mailer'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// 6-digit numeric verification code (000000–999999)
function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}
const CODE_TTL_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone } = body

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error('Registration error: Supabase not configured')
      return NextResponse.json({ error: 'Registration is temporarily unavailable. Please try again later.' }, { status: 500 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const code = generateCode()
    const codeExpires = new Date(Date.now() + CODE_TTL_MS).toISOString()
    const passwordHash = await bcrypt.hash(password, 12)

    // Check if email already exists
    const { data: existing, error: lookupError } = await supabase
      .from('profiles')
      .select('id, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (lookupError) {
      console.error('Registration lookup error:', lookupError)
      return NextResponse.json({ error: 'Registration failed. Please try again later.' }, { status: 500 })
    }

    if (existing) {
      // If the account exists but was never verified, treat this as a re-attempt:
      // refresh the password + code and re-send, so the user isn't stuck.
      if (!existing.email_verified) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            password_hash: passwordHash,
            verification_token: code,
            verification_token_expires: codeExpires,
            ...(phone?.trim() ? { phone: phone.trim() } : {}),
          })
          .eq('id', existing.id)

        if (updErr) {
          console.error('Registration re-attempt update error:', updErr)
          return NextResponse.json({ error: 'Registration failed. Please try again later.' }, { status: 500 })
        }

        try {
          await sendVerificationEmail(normalizedEmail, fullName.trim(), code)
        } catch (emailErr) {
          console.error('Verification email failed to send:', emailErr)
        }

        return NextResponse.json({
          success: true,
          email: normalizedEmail,
          message: 'Verification code sent. Please check your email.',
        })
      }

      // Already verified → genuine duplicate
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Create profile — role always forced to 'customer'
    const insertData: Record<string, unknown> = {
      email: normalizedEmail,
      full_name: fullName.trim(),
      password_hash: passwordHash,
      role: 'customer',
      is_active: true,
      email_verified: false,
      verification_token: code,
      verification_token_expires: codeExpires,
    }

    // Only add phone if provided and non-empty
    if (phone?.trim()) {
      insertData.phone = phone.trim()
    }

    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert(insertData)
      .select('id, email, full_name')
      .single()

    if (insertError) {
      console.error('Registration insert error:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({ error: 'Registration failed. Please try again later.' }, { status: 500 })
    }

    // Send verification code email (non-blocking — don't fail registration if email fails)
    try {
      await sendVerificationEmail(profile.email, fullName.trim(), code)
    } catch (emailErr) {
      console.error('Verification email failed to send:', emailErr)
    }

    return NextResponse.json({
      success: true,
      email: profile.email,
      message: 'Account created! Please check your email for your verification code.',
    })
  } catch (err) {
    console.error('Registration catch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, role } = body

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
      return NextResponse.json({ error: 'Database not configured. Check SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 })
    }

    // Check if email already exists
    const { data: existing, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (lookupError) {
      console.error('Registration lookup error:', lookupError)
      return NextResponse.json({ error: `Database error: ${lookupError.message}` }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create profile - use gen_random_uuid() on DB side for id
    const insertData: any = {
      email: email.toLowerCase(),
      full_name: fullName.trim(),
      password_hash: passwordHash,
      role: role || 'customer',
      is_active: true,
    }

    // Only add phone if provided and non-empty
    if (phone?.trim()) {
      insertData.phone = phone.trim()
    }

    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert(insertData)
      .select('id, email, full_name, role')
      .single()

    if (insertError) {
      console.error('Registration insert error:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({
        error: `Registration failed: ${insertError.message}`,
        code: insertError.code,
        details: insertError.details
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: profile.id, role: profile.role })
  } catch (err: any) {
    console.error('Registration catch error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

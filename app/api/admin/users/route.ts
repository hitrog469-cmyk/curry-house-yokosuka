import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'admin') return null
  return session
}

// GET — list all users
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

// POST — create new user with any role
export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { email, password, fullName, phone, role } = body

  if (!email || !password || !fullName || !role) {
    return NextResponse.json(
      { error: 'email, password, fullName, and role are required' },
      { status: 400 }
    )
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  const validRoles = ['admin', 'staff', 'reception', 'kitchen', 'customer']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Role must be one of: ${validRoles.join(', ')}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      email: email.toLowerCase(),
      full_name: fullName.trim(),
      password_hash: passwordHash,
      role,
      phone: phone?.trim() || null,
      is_active: true,
    })
    .select('id, email, full_name, role, phone, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data }, { status: 201 })
}

// PATCH — update role, active status, or reset password
export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, role, is_active, password, full_name, phone } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const updates: Record<string, any> = {}
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active
  if (full_name !== undefined) updates.full_name = full_name
  if (phone !== undefined) updates.phone = phone
  if (password) {
    if (password.length < 8) return NextResponse.json({ error: 'Password min 8 chars' }, { status: 400 })
    updates.password_hash = await bcrypt.hash(password, 12)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, email, full_name, role, phone, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}

// DELETE — deactivate user (soft delete)
export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

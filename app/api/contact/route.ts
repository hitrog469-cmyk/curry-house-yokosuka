import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendContactEmail } from '@/lib/email'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'name, email, subject, and message are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

    // Save to DB
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({ name, email, phone: phone || null, subject, message, status: 'new' })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('[contact] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send emails (non-blocking — don't fail if email fails)
    sendContactEmail({ name, email, phone, subject, message }).catch((err) =>
      console.error('[contact] Email error:', err)
    )

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err: any) {
    console.error('[contact] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// GET: for admin to fetch messages (requires admin session)
export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

// PATCH: update status
export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}

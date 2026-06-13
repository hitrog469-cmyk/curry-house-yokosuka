import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import { sendCateringEmail } from '@/lib/email'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function isAdmin() {
  const session = await auth()
  return !!session && (session.user as any)?.role === 'admin'
}

// POST: submit catering inquiry + trigger email
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email, event_type, guest_count, event_date, event_time, special_requirements } = body

    if (!name || !phone || !email || !event_type || !guest_count || !event_date || !event_time) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

    const { data, error } = await supabase
      .from('catering_inquiries')
      .insert({
        name, phone, email,
        event_type,
        guest_count: parseInt(guest_count),
        event_date, event_time,
        special_requirements: special_requirements || null,
        status: 'pending',
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('[catering] DB error:', error)
      return NextResponse.json({ error: 'Failed to submit inquiry. Please try again later.' }, { status: 500 })
    }

    // Send emails (non-blocking)
    sendCateringEmail({
      name, email, phone, event_type,
      guest_count: parseInt(guest_count),
      event_date, event_time,
      special_requirements,
    }).catch((err) => console.error('[catering] Email error:', err))

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err: any) {
    console.error('[catering] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: for admin
export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('catering_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    console.error('[catering] DB error:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
  return NextResponse.json({ inquiries: data })
}

// PATCH: update status
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { data, error } = await supabase
    .from('catering_inquiries')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[catering] DB error:', error)
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 })
  }
  return NextResponse.json({ inquiry: data })
}

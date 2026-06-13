import { NextResponse } from 'next/server'
import { getServiceClient, getUser, validateToken, genKey, hashKey, ACTIVE_STATUSES } from '@/lib/table-auth'

// Start a brand-new table session (no active session must exist for the table).
// Returns the plaintext per-session key ONCE — the customer must save it.
export async function POST(request: Request) {
  try {
    const { table, token, customerName, partySize } = await request.json()
    const tableNumber = parseInt(String(table), 10)

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })

    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    if (!(await validateToken(supabase, tableNumber, String(token || '')))) {
      return NextResponse.json({ error: 'INVALID_QR' }, { status: 403 })
    }

    // Guard against an existing active session (also enforced by the partial unique index)
    const { data: existing } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('table_number', tableNumber)
      .in('status', ACTIVE_STATUSES as unknown as string[])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'TABLE_OCCUPIED' }, { status: 409 })
    }

    const key = genKey()
    const { data: session, error } = await supabase
      .from('table_sessions')
      .insert({
        table_number: tableNumber,
        session_token: `tbl${tableNumber}_${Date.now()}`,
        customer_name: String(customerName || '').slice(0, 120),
        party_size: Math.max(1, Math.min(50, parseInt(String(partySize), 10) || 1)),
        status: 'active',
        owner_user_id: user.id,
        owner_email: user.email,
        session_key_hash: hashKey(key),
      })
      .select('id')
      .single()

    if (error || !session) {
      // Unique-index violation means another device just claimed the table
      if (error?.code === '23505') {
        return NextResponse.json({ error: 'TABLE_OCCUPIED' }, { status: 409 })
      }
      console.error('table/start insert error:', error)
      return NextResponse.json({ error: 'Could not start the table. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ sessionId: session.id, key })
  } catch (err) {
    console.error('table/start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getServiceClient, getUser, validateToken, hashKey, ACTIVE_STATUSES } from '@/lib/table-auth'

// Resume an active session owned by someone else by entering the saved key.
export async function POST(request: Request) {
  try {
    const { table, token, key } = await request.json()
    const tableNumber = parseInt(String(table), 10)

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })

    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    if (!(await validateToken(supabase, tableNumber, String(token || '')))) {
      return NextResponse.json({ error: 'INVALID_QR' }, { status: 403 })
    }

    const cleanKey = String(key || '').trim().toUpperCase()
    if (cleanKey.length < 4) {
      return NextResponse.json({ error: 'INVALID_KEY' }, { status: 400 })
    }

    const { data: session } = await supabase
      .from('table_sessions')
      .select('id, customer_name, party_size, total_amount, session_key_hash')
      .eq('table_number', tableNumber)
      .in('status', ACTIVE_STATUSES as unknown as string[])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!session || !session.session_key_hash || session.session_key_hash !== hashKey(cleanKey)) {
      return NextResponse.json({ error: 'INVALID_KEY' }, { status: 400 })
    }

    return NextResponse.json({
      state: 'resume',
      sessionId: session.id,
      customerName: session.customer_name,
      partySize: session.party_size,
      total: session.total_amount,
    })
  } catch (err) {
    console.error('table/resume error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

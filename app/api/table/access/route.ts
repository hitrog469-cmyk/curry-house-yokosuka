import { NextResponse } from 'next/server'
import { getServiceClient, getUser, validateToken, ACTIVE_STATUSES } from '@/lib/table-auth'

// Determine how a logged-in customer may enter a table after scanning the QR.
export async function POST(request: Request) {
  try {
    const { table, token } = await request.json()
    const tableNumber = parseInt(String(table), 10)

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })

    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    if (!(await validateToken(supabase, tableNumber, String(token || '')))) {
      return NextResponse.json({ error: 'INVALID_QR' }, { status: 403 })
    }

    const { data: session } = await supabase
      .from('table_sessions')
      .select('id, customer_name, party_size, total_amount, owner_user_id, status')
      .eq('table_number', tableNumber)
      .in('status', ACTIVE_STATUSES as unknown as string[])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!session) {
      return NextResponse.json({ state: 'new' })
    }

    if (session.owner_user_id && session.owner_user_id === user.id) {
      return NextResponse.json({
        state: 'resume',
        sessionId: session.id,
        customerName: session.customer_name,
        partySize: session.party_size,
        total: session.total_amount,
      })
    }

    // Active session owned by someone else (or legacy session with no owner) → key required
    return NextResponse.json({ state: 'locked', sessionId: session.id })
  } catch (err) {
    console.error('table/access error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getServiceClient, getUser, validateToken, authorizeSession } from '@/lib/table-auth'

// Customer requests the bill for their authorized session.
export async function POST(request: Request) {
  try {
    const { sessionId, table, token, key } = await request.json()
    const tableNumber = parseInt(String(table), 10)

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })

    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    if (!(await validateToken(supabase, tableNumber, String(token || '')))) {
      return NextResponse.json({ error: 'INVALID_QR' }, { status: 403 })
    }

    const authz = await authorizeSession(supabase, { sessionId: String(sessionId), tableNumber, user, key })
    if (!authz.ok) return NextResponse.json({ error: authz.code }, { status: authz.status })

    await supabase
      .from('table_sessions')
      .update({ status: 'bill_requested', updated_at: new Date().toISOString() })
      .eq('id', authz.session.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('table/bill error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

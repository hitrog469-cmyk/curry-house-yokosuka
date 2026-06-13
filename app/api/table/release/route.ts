import { NextResponse } from 'next/server'
import { getServiceClient, getUser } from '@/lib/table-auth'

// Staff/admin release a table after payment is settled, freeing it for the next party.
const ALLOWED_ROLES = ['admin', 'staff', 'reception']

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    const { error } = await supabase
      .from('table_sessions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        released_by: user.name || user.email,
      })
      .eq('id', sessionId)

    if (error) {
      console.error('table/release error:', error.message)
      return NextResponse.json({ error: 'Could not release the table. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('table/release error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

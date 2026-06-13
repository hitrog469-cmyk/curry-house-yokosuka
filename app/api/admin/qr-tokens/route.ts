import { NextResponse } from 'next/server'
import { getServiceClient, getUser, genKey } from '@/lib/table-auth'

// Admin-only: read (and optionally regenerate) the per-table QR tokens.
// Tokens are NOT exposed to the public anon role — only through this admin route.

export async function GET() {
  const user = await getUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

  const { data, error } = await supabase
    .from('table_qr_tokens')
    .select('table_number, token, is_active')
    .order('table_number', { ascending: true })

  if (error) return NextResponse.json({ error: 'Could not load tokens' }, { status: 500 })
  return NextResponse.json({ tokens: data })
}

// Regenerate the token for a single table (invalidates its existing printed QR).
export async function POST(request: Request) {
  const user = await getUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await request.json()
  const tableNumber = parseInt(String(table), 10)
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 18) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  const supabase = getServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

  const newToken = `TCH-T${String(tableNumber).padStart(2, '0')}-${genKey(8)}`
  const { error } = await supabase
    .from('table_qr_tokens')
    .update({ token: newToken, is_active: true, updated_at: new Date().toISOString() })
    .eq('table_number', tableNumber)

  if (error) return NextResponse.json({ error: 'Could not regenerate token' }, { status: 500 })
  return NextResponse.json({ table_number: tableNumber, token: newToken })
}

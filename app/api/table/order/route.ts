import { NextResponse } from 'next/server'
import { getServiceClient, getUser, validateToken, authorizeSession } from '@/lib/table-auth'
import { ORDERING_ENABLED } from '@/lib/site-config'

// Place an order against an active, authorized table session.
// The client builds the (complex) order payload; the server authorizes and writes it.
export async function POST(request: Request) {
  try {
    if (!ORDERING_ENABLED) {
      return NextResponse.json({ error: 'ORDERING_DISABLED' }, { status: 403 })
    }

    const body = await request.json()
    const {
      sessionId, table, token, key,
      orderItems, totalAmount, customerName, partySize,
      splitBill, numberOfSplits, amountPerSplit, tableOrderNotes, ordersNotes, isAddon,
    } = body
    const tableNumber = parseInt(String(table), 10)

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })

    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    if (!(await validateToken(supabase, tableNumber, String(token || '')))) {
      return NextResponse.json({ error: 'INVALID_QR' }, { status: 403 })
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ error: 'Empty order' }, { status: 400 })
    }

    const authz = await authorizeSession(supabase, { sessionId: String(sessionId), tableNumber, user, key })
    if (!authz.ok) return NextResponse.json({ error: authz.code }, { status: authz.status })

    const total = Number(totalAmount) || 0
    const splits = Math.max(1, parseInt(String(numberOfSplits), 10) || 1)
    const people = Math.max(1, parseInt(String(partySize), 10) || 1)

    // 1. Kitchen-facing in-house order
    const { error: tableError } = await supabase.from('table_orders').insert({
      table_number: tableNumber,
      customer_name: customerName || 'Table Guest',
      party_size: people,
      split_bill: !!splitBill,
      number_of_splits: splits,
      items: orderItems,
      total_amount: total,
      amount_per_split: Number(amountPerSplit) || 0,
      status: 'pending',
      order_type: 'in-house',
      session_id: authz.session.id,
      is_addon: !!isAddon,
      notes: String(tableOrderNotes || ''),
    })
    if (tableError) {
      console.error('table/order table_orders insert:', tableError.message)
      return NextResponse.json({ error: 'Could not place order. Please try again.' }, { status: 500 })
    }

    // 2. Accumulate session total (add-ons stack on the running total)
    const newTotal = isAddon ? (authz.session.total_amount || 0) + total : total
    await supabase
      .from('table_sessions')
      .update({ total_amount: newTotal, status: 'ordering', updated_at: new Date().toISOString() })
      .eq('id', authz.session.id)

    // 3. Mirror into the unified orders table (reporting/analytics)
    const { error: orderError } = await supabase.from('orders').insert({
      total_amount: total,
      status: 'pending',
      order_type: 'in-house',
      table_number: tableNumber,
      customer_name: customerName || 'Table Guest',
      customer_phone: '',
      party_size: people,
      split_bill: !!splitBill,
      number_of_splits: splits,
      items: orderItems,
      payment_method: 'pending',
      payment_status: 'pending',
      delivery_address: `Table ${tableNumber} - ${customerName || 'Guest'} (${people} ${people === 1 ? 'person' : 'people'})`,
      notes: String(ordersNotes || ''),
    })
    if (orderError) console.error('table/order orders mirror insert:', orderError.message)

    return NextResponse.json({ success: true, sessionTotal: newTotal })
  } catch (err) {
    console.error('table/order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createBrowserClient } from '@supabase/ssr'

// Session management utilities for table ordering

export interface TableSession {
  id: string
  table_number: number
  session_token: string
  customer_name: string | null
  party_size: number
  status: 'active' | 'bill_requested' | 'paid' | 'closed'
  device_id: string | null
  total_amount: number
  split_bill: boolean
  number_of_splits: number
  created_at: string
  updated_at: string
}

// Generate a unique session token
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Generate a device fingerprint (simplified version)
export function getDeviceId(): string {
  // Check if we have a stored device ID
  const stored = localStorage.getItem('curry_house_device_id')
  if (stored) return stored

  // Generate a new one
  const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  localStorage.setItem('curry_house_device_id', deviceId)
  return deviceId
}

// Store session info in localStorage
export function storeSessionLocally(session: { sessionId: string; tableNumber: number; token: string }) {
  localStorage.setItem('curry_house_session', JSON.stringify({
    ...session,
    timestamp: Date.now()
  }))
}

// Get stored session from localStorage
export function getStoredSession(): { sessionId: string; tableNumber: number; token: string } | null {
  const stored = localStorage.getItem('curry_house_session')
  if (!stored) return null

  try {
    const session = JSON.parse(stored)
    // Session expires after 6 hours
    const sixHours = 6 * 60 * 60 * 1000
    if (Date.now() - session.timestamp > sixHours) {
      localStorage.removeItem('curry_house_session')
      return null
    }
    return session
  } catch {
    return null
  }
}

// Clear stored session
export function clearStoredSession() {
  localStorage.removeItem('curry_house_session')
}

// Create Supabase client
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Check if table has active session
export async function checkActiveSession(supabase: ReturnType<typeof createSupabaseClient>, tableNumber: number): Promise<TableSession | null> {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('table_number', tableNumber)
    .in('status', ['active', 'bill_requested'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as TableSession
}

// Create new session for table
export async function createSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  tableNumber: number,
  customerName: string,
  partySize: number,
  splitBill: boolean = false,
  numberOfSplits: number = 1
): Promise<TableSession | null> {
  const deviceId = getDeviceId()
  const sessionToken = generateSessionToken()

  const { data, error } = await supabase
    .from('table_sessions')
    .insert({
      table_number: tableNumber,
      session_token: sessionToken,
      customer_name: customerName,
      party_size: partySize,
      status: 'active',
      device_id: deviceId,
      total_amount: 0,
      split_bill: splitBill,
      number_of_splits: numberOfSplits
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create session:', error)
    return null
  }

  // Store session locally
  storeSessionLocally({
    sessionId: data.id,
    tableNumber: data.table_number,
    token: data.session_token
  })

  return data as TableSession
}

// Join existing session (for friends scanning QR)
export async function joinSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  sessionId: string
): Promise<boolean> {
  // For now, just store locally - could add device tracking later
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) return false

  storeSessionLocally({
    sessionId: data.id,
    tableNumber: data.table_number,
    token: data.session_token
  })

  return true
}

// Request bill
export async function requestBill(
  supabase: ReturnType<typeof createSupabaseClient>,
  sessionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('table_sessions')
    .update({ status: 'bill_requested' })
    .eq('id', sessionId)

  return !error
}

// Add order to session
export async function addOrderToSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  sessionId: string,
  items: Array<{
    item_id: string
    name: string
    quantity: number
    price: number
    subtotal: number
    spiceLevel?: string
    addOns?: string[]
    variation?: string
  }>,
  subtotal: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('session_orders')
    .insert({
      session_id: sessionId,
      items: items,
      subtotal: subtotal,
      status: 'pending',
      printed: false
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add order:', error)
    return null
  }

  return data.id
}

// Calculate bill split with remainder handling
export function calculateBillSplit(
  totalAmount: number,
  numberOfSplits: number
): { perPerson: number; firstPersonPays: number; remainder: number } {
  if (numberOfSplits <= 1) {
    return { perPerson: totalAmount, firstPersonPays: totalAmount, remainder: 0 }
  }

  const perPerson = Math.floor(totalAmount / numberOfSplits)
  const remainder = totalAmount - (perPerson * numberOfSplits)

  return {
    perPerson,
    firstPersonPays: perPerson + remainder,
    remainder
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomInt } from 'crypto'
import { auth } from '@/auth'

// Statuses that mean a table is currently in use
export const ACTIVE_STATUSES = ['active', 'ordering', 'bill_requested'] as const

export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export interface TableUser {
  id: string
  email: string
  name: string
  role: string
}

/** Returns the logged-in user (NextAuth) or null. Table ordering requires login. */
export async function getUser(): Promise<TableUser | null> {
  const session = await auth()
  const u = session?.user as Record<string, unknown> | undefined
  if (!u?.id) return null
  return {
    id: String(u.id),
    email: String(u.email || ''),
    name: String((u as { full_name?: string }).full_name || u.name || ''),
    role: String((u as { role?: string }).role || 'customer'),
  }
}

/** Generate a customer-friendly per-session key (no ambiguous chars). */
export function genKey(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I,O,0,1
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[randomInt(0, alphabet.length)]
  return out
}

/** Hash the session key (never store/return plaintext after creation). */
export function hashKey(key: string): string {
  return createHash('sha256').update(key.trim().toUpperCase()).digest('hex')
}

/**
 * Load an active session by id and authorize the caller for it.
 * Authorized when the caller is the session owner OR provides the correct key.
 * Returns the session row on success, or an error code.
 */
export async function authorizeSession(
  supabase: SupabaseClient,
  opts: { sessionId: string; tableNumber: number; user: TableUser; key?: string }
): Promise<{ ok: true; session: { id: string; total_amount: number; status: string } } | { ok: false; code: string; status: number }> {
  const { data: session } = await supabase
    .from('table_sessions')
    .select('id, table_number, status, total_amount, owner_user_id, session_key_hash')
    .eq('id', opts.sessionId)
    .maybeSingle()

  if (!session) return { ok: false, code: 'SESSION_NOT_FOUND', status: 404 }
  if (session.table_number !== opts.tableNumber) return { ok: false, code: 'TABLE_MISMATCH', status: 403 }
  if (!ACTIVE_STATUSES.includes(session.status)) return { ok: false, code: 'SESSION_CLOSED', status: 409 }

  const isOwner = session.owner_user_id && session.owner_user_id === opts.user.id
  const keyOk = opts.key && session.session_key_hash && session.session_key_hash === hashKey(opts.key)
  if (!isOwner && !keyOk) return { ok: false, code: 'NOT_AUTHORIZED', status: 403 }

  return { ok: true, session: { id: session.id, total_amount: session.total_amount, status: session.status } }
}

/** Validate that a QR token belongs to the given table and is active. */
export async function validateToken(
  supabase: SupabaseClient,
  tableNumber: number,
  token: string
): Promise<boolean> {
  if (!token || !Number.isInteger(tableNumber)) return false
  const { data, error } = await supabase
    .from('table_qr_tokens')
    .select('table_number')
    .eq('table_number', tableNumber)
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()
  return !error && !!data
}

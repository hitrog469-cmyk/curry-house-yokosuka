import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
let _checked = false

/**
 * Get the Supabase browser client for DATABASE operations only.
 * Auth is handled by NextAuth — this client is only for querying tables.
 * Caches the client so createClient is only called once.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (_checked) return _client

  _checked = true
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || key.length < 50) {
    _client = null
    return null
  }

  _client = createClient(url, key)
  return _client
}

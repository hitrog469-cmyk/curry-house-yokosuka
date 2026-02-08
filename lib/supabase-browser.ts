import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
let _checked = false

/**
 * Get the Supabase browser client, or null if not configured.
 * Caches the client so createBrowserClient is only called once.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (_checked) return _client

  _checked = true
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || !key.startsWith('eyJ') || key.length < 100) {
    _client = null
    return null
  }

  _client = createBrowserClient(url, key)
  return _client
}

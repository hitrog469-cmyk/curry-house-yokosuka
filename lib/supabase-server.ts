import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client with service role key.
 * Use this in API routes that need to bypass RLS (e.g., creating profiles, updating passwords).
 * NEVER expose this client to the browser.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey || serviceKey.length < 50) {
    console.warn('Supabase service role key not configured')
    return null
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

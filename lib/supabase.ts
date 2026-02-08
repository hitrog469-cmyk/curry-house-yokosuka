import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if we have valid credentials
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

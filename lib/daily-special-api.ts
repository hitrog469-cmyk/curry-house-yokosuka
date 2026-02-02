// Daily Special API Functions
// CRUD operations for managing Today's Special feature

import { createBrowserClient } from '@supabase/ssr'

export type DailySpecial = {
  id: string
  menu_item_id: string
  menu_item_name: string
  original_price: number
  special_price: number
  discount_percentage: number
  display_text: string
  is_active: boolean
  valid_date: string
  valid_from: string
  valid_until: string
  created_at: string
  updated_at: string
}

/**
 * Get today's active special
 */
export async function getTodaysSpecial(): Promise<DailySpecial | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('daily_specials')
    .select('*')
    .eq('is_active', true)
    .eq('valid_date', new Date().toISOString().split('T')[0])
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching daily special:', error)
    return null
  }

  // Calculate discount percentage if not set
  if (!data.discount_percentage && data.original_price && data.special_price) {
    data.discount_percentage = Math.round(
      ((data.original_price - data.special_price) / data.original_price) * 100
    )
  }

  return data
}

/**
 * Get all daily specials (for admin)
 */
export async function getAllDailySpecials(): Promise<DailySpecial[]> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('daily_specials')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all daily specials:', error)
    return []
  }

  return data || []
}

/**
 * Create a new daily special
 */
export async function createDailySpecial(special: {
  menu_item_id: string
  menu_item_name: string
  original_price: number
  special_price: number
  display_text?: string
  valid_from?: string
  valid_until?: string
}): Promise<{ success: boolean; data?: DailySpecial; error?: string }> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Calculate discount percentage
  const discount_percentage = Math.round(
    ((special.original_price - special.special_price) / special.original_price) * 100
  )

  // Deactivate any existing active specials for today
  await supabase
    .from('daily_specials')
    .update({ is_active: false })
    .eq('is_active', true)
    .eq('valid_date', new Date().toISOString().split('T')[0])

  // Create new special
  const { data, error } = await supabase
    .from('daily_specials')
    .insert({
      ...special,
      discount_percentage,
      is_active: true,
      valid_date: new Date().toISOString().split('T')[0],
      valid_from: special.valid_from || '11:00',
      valid_until: special.valid_until || '22:00'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating daily special:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Update an existing daily special
 */
export async function updateDailySpecial(
  id: string,
  updates: Partial<DailySpecial>
): Promise<{ success: boolean; data?: DailySpecial; error?: string }> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Recalculate discount percentage if prices changed
  if (updates.original_price && updates.special_price) {
    updates.discount_percentage = Math.round(
      ((updates.original_price - updates.special_price) / updates.original_price) * 100
    )
  }

  const { data, error } = await supabase
    .from('daily_specials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating daily special:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Deactivate a daily special
 */
export async function deactivateDailySpecial(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('daily_specials')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating daily special:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete a daily special
 */
export async function deleteDailySpecial(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('daily_specials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting daily special:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Check if a special is currently valid (time-based)
 */
export function isSpecialValid(special: DailySpecial): boolean {
  if (!special.is_active) return false

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]

  // Check date
  if (special.valid_date !== currentDate) return false

  // Check time
  const currentTime = now.toTimeString().slice(0, 5)  // HH:mm format
  return currentTime >= special.valid_from && currentTime <= special.valid_until
}

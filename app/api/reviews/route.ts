// @v2
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

// GET /api/reviews — public, returns visible reviews
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    if (!supabase) return NextResponse.json({ reviews: [] })

    const { searchParams } = new URL(req.url)
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('reviews')
      .select('id, rating, comment, reviewer_name, is_featured, is_verified, created_at')
      .eq('is_hidden', false)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (featured) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ reviews: data || [] })
  } catch (err) {
    console.error('GET /api/reviews error:', err)
    return NextResponse.json({ reviews: [] }, { status: 200 })
  }
}

// POST /api/reviews — create a review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, orderType, rating, comment, reviewerName } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
    }
    if (!reviewerName) {
      return NextResponse.json({ error: 'Reviewer name required' }, { status: 400 })
    }

    // Get profile_id from session (optional — reviews can be anonymous too)
    let profileId: string | null = null
    try {
      const session = await auth()
      profileId = (session?.user as any)?.id || null
    } catch {
      // continue without profile_id
    }

    const supabase = getSupabaseServiceClient()
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        profile_id: profileId,
        order_id: orderId || null,
        order_type: orderType || 'online',
        rating,
        comment: comment?.slice(0, 500) || null,
        reviewer_name: reviewerName.slice(0, 100),
        is_verified: !!profileId,
        is_featured: false,
        is_hidden: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ review: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reviews error:', err)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}

// PATCH /api/reviews — admin: toggle featured/hidden
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, is_featured, is_hidden } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const supabase = getSupabaseServiceClient()
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    const updates: Record<string, boolean> = {}
    if (typeof is_featured === 'boolean') updates.is_featured = is_featured
    if (typeof is_hidden === 'boolean') updates.is_hidden = is_hidden

    const { error } = await supabase.from('reviews').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/reviews error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

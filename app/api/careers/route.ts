import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import { sendCareerEmail } from '@/lib/email'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function isAdmin() {
  const session = await auth()
  return !!session && (session.user as any)?.role === 'admin'
}

const ALLOWED_CV_EXTENSIONS = ['pdf', 'doc', 'docx']
const MAX_CV_SIZE = 5 * 1024 * 1024 // 5MB

// POST: submit application (multipart/form-data with optional CV file)
export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const position = formData.get('position') as string
    const cover_letter = formData.get('cover_letter') as string
    const cvFile = formData.get('cv') as File | null

    if (!name || !email || !phone || !position || !cover_letter) {
      return NextResponse.json(
        { error: 'name, email, phone, position, and cover_letter are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

    // Upload CV to Supabase Storage if provided
    let cv_url: string | null = null
    let cv_filename: string | null = null

    if (cvFile && cvFile.size > 0) {
      const ext = (cvFile.name.split('.').pop() || '').toLowerCase()
      if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ error: 'CV must be a PDF or Word document (.pdf, .doc, .docx)' }, { status: 400 })
      }
      if (cvFile.size > MAX_CV_SIZE) {
        return NextResponse.json({ error: 'CV file must be 5MB or smaller' }, { status: 400 })
      }
      const safeName = name.replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 60)
      const filename = `${Date.now()}-${safeName}.${ext}`
      const arrayBuffer = await cvFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(filename, buffer, {
          contentType: cvFile.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('cv-uploads').getPublicUrl(filename)
        cv_url = urlData.publicUrl
        cv_filename = cvFile.name
      } else {
        console.warn('[careers] CV upload failed:', uploadError.message)
      }
    }

    // Save application to DB
    const { data, error } = await supabase
      .from('job_applications')
      .insert({ name, email, phone, position, cover_letter, cv_url, cv_filename, status: 'new' })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('[careers] DB error:', error)
      return NextResponse.json({ error: 'Failed to submit application. Please try again later.' }, { status: 500 })
    }

    // Send emails (non-blocking)
    sendCareerEmail({ name, email, phone, position, cover_letter, cv_url: cv_url || undefined }).catch(
      (err) => console.error('[careers] Email error:', err)
    )

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err: any) {
    console.error('[careers] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: for admin to fetch applications
export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('job_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    console.error('[careers] DB error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
  return NextResponse.json({ applications: data })
}

// PATCH: update application status / notes
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const body = await request.json()
  const { id, status, notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, any> = {}
  if (status) updates.status = status
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('job_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[careers] DB error:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
  return NextResponse.json({ application: data })
}

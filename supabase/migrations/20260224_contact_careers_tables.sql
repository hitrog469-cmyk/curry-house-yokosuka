-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  cover_letter TEXT NOT NULL,
  cv_url TEXT,
  cv_filename TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only service role can read/write (admin API uses service role key)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (public form submissions)
CREATE POLICY "Allow public insert contact_messages"
  ON contact_messages FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public insert job_applications"
  ON job_applications FOR INSERT TO anon WITH CHECK (true);

-- Supabase Storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  true,
  5242880, -- 5MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to cv-uploads
CREATE POLICY "Allow public upload cv"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'cv-uploads');

CREATE POLICY "Allow public read cv"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'cv-uploads');

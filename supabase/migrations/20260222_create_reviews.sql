-- Reviews & Feedback table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id TEXT,
  order_type TEXT DEFAULT 'online',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible reviews"
  ON reviews FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "Anyone can insert review"
  ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can manage all reviews"
  ON reviews FOR ALL
  USING (true)
  WITH CHECK (true);

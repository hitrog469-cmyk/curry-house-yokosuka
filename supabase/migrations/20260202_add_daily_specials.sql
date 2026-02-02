-- Create daily_specials table for Today's Special feature
-- Allows admin to set featured menu items with special pricing

CREATE TABLE IF NOT EXISTS daily_specials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL,
  menu_item_name TEXT NOT NULL,
  original_price INTEGER NOT NULL,
  special_price INTEGER NOT NULL,
  discount_percentage INTEGER,
  display_text TEXT DEFAULT 'Chef''s Special - Limited Time!',
  is_active BOOLEAN DEFAULT true,
  valid_date DATE DEFAULT CURRENT_DATE,
  valid_from TIME DEFAULT '11:00',
  valid_until TIME DEFAULT '22:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for active specials query
CREATE INDEX IF NOT EXISTS idx_daily_specials_active ON daily_specials(is_active, valid_date) WHERE is_active = true;

-- Enable RLS
ALTER TABLE daily_specials ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active specials
CREATE POLICY "Allow public read access to active specials" ON daily_specials
  FOR SELECT
  USING (is_active = true AND valid_date = CURRENT_DATE);

-- Allow authenticated admin users to manage specials
CREATE POLICY "Allow admin users to manage specials" ON daily_specials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed with default Chef's Special
INSERT INTO daily_specials (
  menu_item_id,
  menu_item_name,
  original_price,
  special_price,
  discount_percentage,
  display_text,
  is_active
) VALUES (
  'chk-1',
  'Butter Chicken',
  1150,
  850,
  26,
  'Chef''s Special - Our signature creamy butter chicken at an unbeatable price!',
  true
) ON CONFLICT DO NOTHING;

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_specials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_specials_updated_at
  BEFORE UPDATE ON daily_specials
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_specials_updated_at();

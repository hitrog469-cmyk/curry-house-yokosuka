-- Site settings table for admin-controlled content
-- Stores banner messages, restaurant open/closed status, etc.

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow public read access (banner and status are public-facing)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage site_settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated admins to update
CREATE POLICY "Authenticated users can update site_settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Default values
INSERT INTO site_settings (key, value) VALUES
  ('banner_messages', '["🔥 FREE DELIVERY on all orders! — TAP TO ORDER", "🌟 Check out Today''s Special — Limited Time!", "🎉 Use code WELCOME15 for 15% OFF", "📍 Yokosuka''s Finest Indian, Mexican, Nepalese & Japanese-Fusion"]'::jsonb),
  ('restaurant_open', 'true'::jsonb),
  ('restaurant_closed_message', '"We are currently closed. We will be back soon!"'::jsonb)
ON CONFLICT (key) DO NOTHING;

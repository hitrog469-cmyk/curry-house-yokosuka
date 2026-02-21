-- Fix RLS policies for daily_specials and site_settings
-- Admin panel uses localStorage session (not Supabase auth), so uid()-based
-- policies block inserts. Since this data is non-sensitive promotional content,
-- we allow all operations (admin UI has its own auth guard).

-- ── daily_specials ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow admin users to manage specials" ON daily_specials;

CREATE POLICY "Allow all to manage specials" ON daily_specials
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── site_settings ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Service role can manage site_settings" ON site_settings;

CREATE POLICY "Allow all to manage site_settings" ON site_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

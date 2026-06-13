-- ============================================================
-- SECURE TABLE ORDERING + ENFORCE ORDERING PAUSE  (consolidated, idempotent)
-- ============================================================
-- Run this ONCE in: Supabase Dashboard -> SQL Editor.
-- Every statement is guarded so it skips anything that doesn't exist in your
-- DB (the older table-session migrations were inconsistent). Safe to re-run.
--
-- What it does:
--   * Adds session ownership + per-session key (hash) columns.
--   * Regenerates strong QR tokens and hides the token table from the public.
--   * Blocks the public anon key from creating/modifying sessions or inserting
--     orders (table ordering + online ordering are now server-authoritative).
-- ============================================================

DO $$
BEGIN
  -- ---------- 1. table_sessions: ownership + key columns + lockdown ----------
  IF to_regclass('public.table_sessions') IS NOT NULL THEN
    ALTER TABLE public.table_sessions
      ADD COLUMN IF NOT EXISTS owner_user_id    UUID,
      ADD COLUMN IF NOT EXISTS owner_email      TEXT,
      ADD COLUMN IF NOT EXISTS session_key_hash TEXT;

    CREATE INDEX IF NOT EXISTS idx_table_sessions_owner
      ON public.table_sessions(owner_user_id);

    DROP POLICY IF EXISTS "Anyone can create table sessions" ON public.table_sessions;
    DROP POLICY IF EXISTS "Anyone can update table sessions" ON public.table_sessions;
    DROP POLICY IF EXISTS "Anyone can create sessions"       ON public.table_sessions;
    DROP POLICY IF EXISTS "Anyone can update sessions"       ON public.table_sessions;
    REVOKE INSERT, UPDATE, DELETE ON public.table_sessions FROM anon;
  END IF;

  -- ---------- 2. table_qr_tokens: fresh strong tokens + hide from public ----------
  IF to_regclass('public.table_qr_tokens') IS NOT NULL THEN
    UPDATE public.table_qr_tokens
    SET token = 'TCH-T' || lpad(table_number::text, 2, '0') || '-' ||
                upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
        is_active = true,
        updated_at = now();

    DROP POLICY IF EXISTS "Anyone can read QR tokens" ON public.table_qr_tokens;
    REVOKE ALL ON public.table_qr_tokens FROM anon;
  END IF;

  -- ---------- 3. session_orders: server-write-only ----------
  IF to_regclass('public.session_orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can create session orders" ON public.session_orders;
    DROP POLICY IF EXISTS "Anyone can update session orders" ON public.session_orders;
    REVOKE INSERT, UPDATE, DELETE ON public.session_orders FROM anon;
  END IF;

  -- ---------- 4. table_orders: customer inserts go through the server ----------
  IF to_regclass('public.table_orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can create table orders" ON public.table_orders;
    REVOKE INSERT ON public.table_orders FROM anon;
  END IF;

  -- ---------- 5. orders: enforce the online-ordering pause at the DB ----------
  IF to_regclass('public.orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
    DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
    REVOKE INSERT ON public.orders FROM anon;
  END IF;
END $$;

-- ============================================================
-- VERIFY (optional): see the new tokens and confirm the columns exist
-- ============================================================
-- SELECT table_number, token FROM public.table_qr_tokens ORDER BY table_number;
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'table_sessions'
--   AND column_name IN ('owner_user_id','owner_email','session_key_hash');

-- ============================================================
-- ROLLBACK (run only to restore the old open behaviour)
-- ============================================================
-- GRANT SELECT ON public.table_qr_tokens TO anon;
-- CREATE POLICY "Anyone can read QR tokens" ON public.table_qr_tokens
--   FOR SELECT TO anon, authenticated USING (true);
-- GRANT INSERT, UPDATE ON public.table_sessions TO anon;
-- CREATE POLICY "Anyone can create sessions" ON public.table_sessions
--   FOR INSERT TO anon, authenticated WITH CHECK (true);
-- CREATE POLICY "Anyone can update sessions" ON public.table_sessions
--   FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
-- GRANT INSERT, UPDATE ON public.session_orders TO anon;
-- GRANT INSERT ON public.table_orders TO anon;
-- GRANT INSERT ON public.orders TO anon;

-- ============================================================
-- ENFORCE ORDERING PAUSE AT THE DATABASE LEVEL
-- ============================================================
-- Context: lib/site-config.ts -> ORDERING_ENABLED = false pauses ordering
-- in the UI, but orders are inserted from the browser using the public anon
-- key. Without this migration a technical user could still POST an order
-- straight to Supabase. Running this makes the pause real at the DB layer.
--
-- HOW TO USE:
--   * To PAUSE ordering   -> run the "PAUSE" section below (it is active).
--   * To RE-ENABLE later  -> set ORDERING_ENABLED = true in lib/site-config.ts,
--                            redeploy, AND run the "RE-ENABLE" section at the
--                            bottom (currently commented out).
--
-- Run this in: Supabase Dashboard -> SQL Editor.
-- ============================================================

-- ---------- PAUSE (active) ----------

-- Delivery / pickup orders: remove the anonymous INSERT path.
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
REVOKE INSERT ON orders FROM anon;

-- In-house table orders: remove the anonymous INSERT path.
DROP POLICY IF EXISTS "Anyone can create table orders" ON table_orders;
REVOKE INSERT ON table_orders FROM anon;

-- ---------- RE-ENABLE (run only when relaunching ordering) ----------
-- Uncomment everything below and run it to restore anonymous ordering.
--
-- GRANT INSERT ON orders TO anon;
-- CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT TO anon
--   WITH CHECK (true);
--
-- GRANT INSERT ON table_orders TO anon;
-- CREATE POLICY "Anyone can create table orders" ON table_orders FOR INSERT
--   TO anon WITH CHECK (true);


-- ============================================================
-- OPTIONAL HARDENING (not required for the pause, recommended later)
-- ============================================================
-- The tracking page relies on an over-broad anonymous read policy:
--   CREATE POLICY "Anyone can view orders by phone" ON orders FOR SELECT
--     TO anon USING (true);
-- USING (true) lets anyone with the public anon key read EVERY order
-- (customer names, phones, addresses). Recommended fix is to move order
-- tracking behind a server API route (service role + explicit order-id +
-- phone match) and then drop this policy:
--
-- DROP POLICY IF EXISTS "Anyone can view orders by phone" ON orders;
-- REVOKE SELECT ON orders FROM anon;
--
-- (Left commented because dropping it without the server route first would
-- break the public /track page.)

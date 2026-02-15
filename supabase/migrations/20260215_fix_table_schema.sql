-- ============================================
-- FIX: Add missing columns to table_orders and orders tables
-- This fixes order submission failures
-- ============================================

-- 1. Fix table_number constraint (was 15, should be 18)
ALTER TABLE public.table_orders DROP CONSTRAINT IF EXISTS table_orders_table_number_check;
ALTER TABLE public.table_orders ADD CONSTRAINT table_orders_table_number_check CHECK (table_number >= 1 AND table_number <= 20);

-- 2. Add missing columns to table_orders
ALTER TABLE public.table_orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS split_bill BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS number_of_splits INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS amount_per_split INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Add missing columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_number INTEGER,
  ADD COLUMN IF NOT EXISTS party_size INTEGER,
  ADD COLUMN IF NOT EXISTS split_bill BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS number_of_splits INTEGER DEFAULT 1;

-- 4. Make customer_phone nullable for table orders (table orders don't have phone)
ALTER TABLE public.orders ALTER COLUMN customer_phone DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN customer_name DROP NOT NULL;

-- 5. Make total_amount accept decimals on table_orders
ALTER TABLE public.table_orders ALTER COLUMN total_amount TYPE DECIMAL(10,2);

-- 6. Grant permissions
GRANT ALL ON public.table_orders TO anon;
GRANT ALL ON public.table_orders TO authenticated;

GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.orders TO authenticated;

-- 7. Make sure RLS allows anon inserts to orders table too (for non-logged-in customers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can create orders'
  ) THEN
    CREATE POLICY "Anyone can create orders"
      ON public.orders
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can read orders'
  ) THEN
    CREATE POLICY "Anyone can read orders"
      ON public.orders
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can update orders'
  ) THEN
    CREATE POLICY "Anyone can update orders"
      ON public.orders
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 8. Enable realtime for both tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE table_orders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 9. Fix notifications table - allow anon to insert (for non-logged-in reception)
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.notifications TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 10. Make sure notification policies allow anon access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Anon can read notifications'
  ) THEN
    CREATE POLICY "Anon can read notifications"
      ON public.notifications
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

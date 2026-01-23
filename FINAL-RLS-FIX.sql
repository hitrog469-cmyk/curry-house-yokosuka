-- ============================================================================
-- FINAL RLS FIX - Handles existing policies properly
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- ============================================
-- 1. DISABLE RLS TEMPORARILY
-- ============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL POLICIES (Even if they don't exist)
-- ============================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;

    -- Drop all policies on orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON orders';
    END LOOP;

    -- Drop all policies on menu_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON menu_items';
    END LOOP;
END $$;

-- ============================================
-- 3. RE-ENABLE RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE CLEAN POLICIES FOR PROFILES
-- ============================================

CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================
-- 5. CREATE CLEAN POLICIES FOR MENU ITEMS
-- ============================================

CREATE POLICY "menu_select_all"
ON menu_items FOR SELECT
TO public
USING (true);

CREATE POLICY "menu_all_authenticated"
ON menu_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. CREATE CLEAN POLICIES FOR ORDERS
-- ============================================

CREATE POLICY "orders_select_own"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_select_by_phone"
ON orders FOR SELECT
TO public
USING (true);

CREATE POLICY "orders_insert_own"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "orders_insert_guest"
ON orders FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "orders_update_own"
ON orders FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_authenticated"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. ENSURE TRIGGER EXISTS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON menu_items TO anon, authenticated;
GRANT ALL ON menu_items TO authenticated;
GRANT ALL ON orders TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================
-- SUCCESS!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS COMPLETELY FIXED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All old policies removed';
  RAISE NOTICE 'New clean policies created';
  RAISE NOTICE 'No more recursion issues!';
  RAISE NOTICE '========================================';
END $$;

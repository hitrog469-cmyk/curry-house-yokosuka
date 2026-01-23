-- ============================================================================
-- COMPLETE RLS SETUP - Run this AFTER the Fixed Auth Migration
-- ============================================================================

-- ============================================
-- 1. FIX ORDERS TABLE
-- ============================================

-- Add user_id column for Supabase Auth
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Update existing orders to link to profiles by phone
UPDATE orders o SET user_id = p.id
FROM profiles p
WHERE o.customer_phone = p.phone AND o.user_id IS NULL;

-- Fix assigned_staff_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_assigned_staff_id_fkey;
ALTER TABLE orders ALTER COLUMN assigned_staff_id TYPE UUID USING assigned_staff_id::uuid;
ALTER TABLE orders ADD CONSTRAINT orders_assigned_staff_id_fkey
  FOREIGN KEY (assigned_staff_id) REFERENCES auth.users(id);

-- ============================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Only admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert guest orders" ON orders;
DROP POLICY IF EXISTS "Anyone can track orders by phone" ON orders;

-- Menu
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admin can delete menu items" ON menu_items;

-- ============================================
-- 4. PROFILES RLS POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff and admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

-- ============================================
-- 5. MENU ITEMS RLS POLICIES
-- ============================================

-- Everyone can view menu (including guests)
CREATE POLICY "Anyone can view menu items"
ON menu_items FOR SELECT
TO anon, authenticated
USING (true);

-- Only staff and admin can manage menu
CREATE POLICY "Staff can insert menu items"
ON menu_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

CREATE POLICY "Staff can update menu items"
ON menu_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

CREATE POLICY "Admin can delete menu items"
ON menu_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 6. ORDERS RLS POLICIES
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create orders
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow guest orders (unauthenticated checkout)
CREATE POLICY "Anyone can insert guest orders"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Anyone can track orders by phone number
CREATE POLICY "Anyone can track orders by phone"
ON orders FOR SELECT
TO anon, authenticated
USING (customer_phone IS NOT NULL);

-- Users can update their own pending orders
CREATE POLICY "Users can update own pending orders"
ON orders FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

-- Staff can update all orders
CREATE POLICY "Staff can update all orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON menu_items TO authenticated;
GRANT ALL ON orders TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================
-- SUCCESS!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS SETUP COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables configured:';
  RAISE NOTICE '  - profiles (Supabase Auth)';
  RAISE NOTICE '  - menu_items (public read)';
  RAISE NOTICE '  - orders (user + guest + staff)';
  RAISE NOTICE '========================================';
END $$;

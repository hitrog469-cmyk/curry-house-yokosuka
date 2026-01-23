-- Curry House Yokosuka - FINAL RLS Setup
-- Based on actual tables: menu_items, orders, profiles, users
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON orders;

-- Menu items policies
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admin can delete menu items" ON menu_items;

-- Users policies
DROP POLICY IF EXISTS "Users can view own user" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;

-- ============================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. PROFILES TABLE - CRITICAL FOR AUTH
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Staff and admin can view all profiles
CREATE POLICY "Staff can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('staff', 'admin')
  )
);

-- ============================================
-- 4. MENU ITEMS - PUBLIC READ
-- ============================================

-- Everyone (even non-logged in users) can view menu
CREATE POLICY "Anyone can view menu items"
ON menu_items FOR SELECT
TO public
USING (true);

-- Only staff and admin can add menu items
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

-- Only staff and admin can update menu items
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

-- Only admin can delete menu items
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
-- 5. ORDERS - USER AND STAFF ACCESS
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending orders (for cancellation)
CREATE POLICY "Users can update own pending orders"
ON orders FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

-- Staff and admin can view ALL orders
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

-- Staff and admin can update ALL orders
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
-- 6. USERS TABLE (if used)
-- ============================================

-- Users can view their own user record
CREATE POLICY "Users can view own user"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid()::text OR id::uuid = auth.uid());

-- Staff can view all users
CREATE POLICY "Staff can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

-- ============================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

-- Function to auto-create profile when user signs up
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

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON menu_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'RLS Setup Complete! ✅' as status;
SELECT 'Tables with RLS enabled:' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'orders', 'menu_items', 'users');

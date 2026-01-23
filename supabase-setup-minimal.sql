-- Curry House Yokosuka - Minimal RLS Setup
-- Run this in your Supabase SQL Editor

-- First, let's check what tables exist
-- Run this query first to see your current tables:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================
-- 1. DROP EXISTING POLICIES (Fresh Start)
-- ============================================

-- Drop all existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Drop existing policies on orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON orders;

-- Drop existing policies on menu_items (if exists)
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admin can delete menu items" ON menu_items;

-- ============================================
-- 2. ENABLE RLS ON TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. PROFILES TABLE RLS POLICIES
-- ============================================

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow staff and admin to view all profiles
CREATE POLICY "Staff can view all profiles"
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
-- 4. MENU ITEMS RLS POLICIES
-- ============================================

-- Everyone can view menu items (even unauthenticated)
CREATE POLICY "Anyone can view menu items"
ON menu_items FOR SELECT
TO public
USING (true);

-- Only staff and admin can insert menu items
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
-- 5. ORDERS RLS POLICIES
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Staff and admin can view all orders
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

-- Staff and admin can update all orders
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
-- 6. CREATE TRIGGER FOR AUTO PROFILE CREATION
-- ============================================

-- Function to create profile on signup
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON menu_items TO anon, authenticated;
GRANT INSERT, UPDATE ON menu_items TO authenticated;
GRANT ALL ON orders TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- DONE!
-- ============================================

SELECT 'RLS policies setup complete!' as status;

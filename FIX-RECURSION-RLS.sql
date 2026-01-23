-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- This removes the problematic recursive policy checks
-- ============================================================================

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;

-- ============================================
-- 2. CREATE NON-RECURSIVE POLICIES
-- ============================================

-- Users can ALWAYS view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile (but cannot change role)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- IMPORTANT: We'll handle staff/admin access in the application layer
-- instead of RLS to avoid infinite recursion

-- ============================================
-- 3. GRANT DIRECT PERMISSIONS TO SERVICE ROLE
-- ============================================

-- Allow service_role to bypass RLS for admin operations
GRANT ALL ON profiles TO service_role;

-- ============================================
-- SUCCESS
-- ============================================

SELECT 'RLS recursion fixed! ✅' as status;

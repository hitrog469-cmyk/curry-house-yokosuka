-- ============================================================================
-- FIX ORDERS TABLE FOR SUPABASE AUTH
-- This updates orders to work with profiles (Supabase Auth) instead of users
-- ============================================================================

-- Step 1: Add new column for Supabase Auth user
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Step 3: Update existing orders to link to profiles where possible
-- (This tries to match by phone number)
UPDATE orders o
SET user_id = p.id
FROM profiles p
WHERE o.customer_phone = p.phone
AND o.user_id IS NULL;

-- Step 4: Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop all existing order policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

-- Step 6: Create new RLS policies

-- Authenticated users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Authenticated users can create orders
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow unauthenticated orders (for guest checkout)
-- These orders won't have a user_id but will have customer info
CREATE POLICY "Anyone can insert guest orders"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Anyone can view orders by phone (for tracking)
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

-- Step 7: Update assigned_staff_id to reference profiles
-- First, drop the old foreign key
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_assigned_staff_id_fkey;

-- Add new foreign key to auth.users (which profiles references)
ALTER TABLE orders
DROP COLUMN IF EXISTS assigned_staff_id CASCADE;

ALTER TABLE orders
ADD COLUMN assigned_staff_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff ON orders(assigned_staff_id);

SELECT 'Orders table updated successfully! ✅' as status;

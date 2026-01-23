-- Reset All User Logins Except Admin
-- ⚠️ DANGER: This will delete all non-admin accounts!
-- Use with caution - only run this when you want to start fresh

-- ============================================
-- BEFORE RUNNING - READ THIS!
-- ============================================
-- This script will:
-- 1. Delete all auth users except admin
-- 2. Delete all profiles except admin
-- 3. Update orders to keep data integrity
-- 4. Clear all notifications for deleted users

-- To identify your admin account, run this first:
-- SELECT id, email, role FROM profiles WHERE role = 'admin';

-- ============================================
-- OPTION 1: DELETE ALL NON-ADMIN USERS
-- ============================================

-- Step 1: Delete notifications for non-admin users
DELETE FROM notifications
WHERE user_id IN (
  SELECT id FROM profiles WHERE role != 'admin'
);

-- Step 2: Update orders - anonymize customer orders
-- (Keep orders for business records but remove user association)
UPDATE orders
SET user_id = NULL
WHERE user_id IN (
  SELECT id FROM profiles WHERE role != 'admin'
);

-- Step 3: Delete profiles (non-admin)
DELETE FROM profiles
WHERE role != 'admin';

-- Step 4: Delete auth users (non-admin)
-- This requires service_role access
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE p.id IS NULL OR p.role != 'admin'
);

-- ============================================
-- OPTION 2: SOFT DELETE (Deactivate instead of delete)
-- ============================================

-- If you prefer to deactivate instead of delete:
/*
-- Add is_active column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Deactivate all non-admin users
UPDATE profiles
SET is_active = false
WHERE role != 'admin';

-- Update RLS policies to check is_active flag
-- (You'll need to update your existing RLS policies)
*/

-- ============================================
-- OPTION 3: DELETE ONLY CUSTOMERS (Keep Staff)
-- ============================================

-- If you want to keep staff accounts:
/*
DELETE FROM notifications
WHERE user_id IN (
  SELECT id FROM profiles WHERE role = 'customer'
);

UPDATE orders
SET user_id = NULL
WHERE user_id IN (
  SELECT id FROM profiles WHERE role = 'customer'
);

DELETE FROM profiles
WHERE role = 'customer';

DELETE FROM auth.users
WHERE id NOT IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'staff')
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check remaining users
SELECT id, email, role, created_at
FROM profiles
ORDER BY role, created_at DESC;

-- Check auth users count
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Check profiles count
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;

-- ============================================
-- DONE!
-- ============================================

SELECT 'User reset complete! Verify results with queries above.' as status;

-- ============================================
-- ROLLBACK (if something goes wrong)
-- ============================================
-- If you're using a transaction, you can rollback:
-- ROLLBACK;

-- Otherwise, there's no automatic rollback.
-- Make sure to backup your database before running this!

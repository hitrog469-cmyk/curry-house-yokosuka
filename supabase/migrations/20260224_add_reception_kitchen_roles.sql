-- Add 'reception' and 'kitchen' to the profiles role check constraint
-- Run this in Supabase SQL Editor

-- Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated constraint with all 5 roles
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'staff', 'admin', 'reception', 'kitchen'));

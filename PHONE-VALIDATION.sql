-- Phone Number Validation - One Phone Per Account
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ADD UNIQUE CONSTRAINT ON PHONE NUMBER
-- ============================================

-- First, check if there are any duplicate phone numbers
-- Run this query to see duplicates:
-- SELECT phone, COUNT(*) as count
-- FROM profiles
-- WHERE phone IS NOT NULL AND phone != ''
-- GROUP BY phone
-- HAVING COUNT(*) > 1;

-- Add unique constraint to phone column
-- This will fail if duplicates exist - clean them up first
ALTER TABLE profiles
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- ============================================
-- 2. CREATE FUNCTION TO CHECK PHONE AVAILABILITY
-- ============================================

CREATE OR REPLACE FUNCTION is_phone_available(
  phone_number text,
  exclude_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  phone_exists boolean;
BEGIN
  -- Normalize phone number (remove spaces, dashes, etc.)
  phone_number := REGEXP_REPLACE(phone_number, '[^0-9+]', '', 'g');

  -- Check if phone already exists (excluding current user if provided)
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE REGEXP_REPLACE(phone, '[^0-9+]', '', 'g') = phone_number
      AND (exclude_user_id IS NULL OR id != exclude_user_id)
      AND phone IS NOT NULL
      AND phone != ''
  ) INTO phone_exists;

  RETURN NOT phone_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE TRIGGER TO VALIDATE PHONE ON INSERT/UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION validate_phone_unique()
RETURNS trigger AS $$
BEGIN
  -- Skip if phone is NULL or empty
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    RETURN NEW;
  END IF;

  -- Check if phone is available
  IF NOT is_phone_available(NEW.phone, NEW.id) THEN
    RAISE EXCEPTION 'This phone number is already registered with another account. Each phone number can only be used once.'
      USING ERRCODE = 'unique_violation',
            HINT = 'Please use a different phone number or contact support if you believe this is an error.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_validate_phone_unique ON profiles;

-- Create trigger
CREATE TRIGGER trigger_validate_phone_unique
  BEFORE INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_phone_unique();

-- ============================================
-- 4. CREATE INDEX ON PHONE NUMBER FOR PERFORMANCE
-- ============================================

-- Create index for faster phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone)
WHERE phone IS NOT NULL AND phone != '';

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION is_phone_available(text, uuid) TO authenticated;

-- ============================================
-- DONE!
-- ============================================

SELECT 'Phone validation setup complete! One phone number per account enforced.' as status;

-- ============================================
-- CLEANUP SCRIPT (Run if you have duplicates)
-- ============================================

-- Uncomment and modify this script if you need to clean up existing duplicates
-- before adding the unique constraint:

/*
-- Find and fix duplicate phone numbers
WITH duplicates AS (
  SELECT phone, MIN(id) as keep_id
  FROM profiles
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone
  HAVING COUNT(*) > 1
)
UPDATE profiles p
SET phone = NULL
WHERE p.phone IN (SELECT phone FROM duplicates)
  AND p.id NOT IN (SELECT keep_id FROM duplicates);

-- After cleaning, run the ALTER TABLE command above
*/

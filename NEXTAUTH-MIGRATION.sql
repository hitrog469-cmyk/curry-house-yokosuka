-- NextAuth Migration: Add password_hash and reset token columns to profiles table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Add password_hash column for credential-based auth
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add is_active column (used by auth to check if account is active)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add reset token columns for password recovery
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Remove the old UUID primary key constraint referencing auth.users
-- Since we're no longer using Supabase Auth, the profiles.id should be a standalone UUID
-- NOTE: Only run this if your profiles.id references auth.users(id)
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make sure the id column has a default UUID generator
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure email has a unique index (required for NextAuth credential lookups)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON profiles(email);

-- Update RLS policies if needed (anon key can read menu_items, service role bypasses RLS)
-- No changes needed if you're using the service role key for auth operations

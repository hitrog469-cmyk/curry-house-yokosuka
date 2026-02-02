-- QUICK FIX: Create users table for admin/staff login
-- Run this in Supabase SQL Editor NOW

-- Drop existing table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct structure
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (username, password, role, name, is_active)
VALUES ('admin', 'admin123', 'admin', 'Administrator', true);

-- Insert default staff user
INSERT INTO users (username, password, role, name, is_active)
VALUES ('staff1', 'staff123', 'staff', 'Staff Member 1', true);

-- Verify
SELECT * FROM users;

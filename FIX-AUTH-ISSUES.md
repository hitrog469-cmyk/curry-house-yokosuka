# Fix RLS Authentication Issues

## Problem
Your Supabase RLS (Row Level Security) policies are blocking profile queries, preventing users from accessing their own data.

## Solution

### Step 1: Run the SQL Setup File

1. Open your Supabase Dashboard: https://vhufyubdpsvkdbjpqetb.supabase.co
2. Navigate to: **SQL Editor** (left sidebar)
3. Create a **New Query**
4. Copy the entire contents of `supabase-setup.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

This will:
- Drop all existing conflicting RLS policies
- Create proper policies for profiles, orders, menu_items, and order_items
- Set up auto-profile creation trigger for new signups
- Configure correct permissions

### Step 2: Verify It Works

After running the SQL:

1. Log out of your application
2. Log back in
3. Try accessing the Profile page - it should now work!

### Step 3: Test Profile Updates

1. Go to Profile page
2. Click "Edit Profile"
3. Update your name/phone
4. Save - should work without errors

## What Was Fixed

1. **Profile Access**: Users can now read and update their own profiles
2. **Auto Profile Creation**: New signups automatically create profile records
3. **Menu Access**: Everyone can view menu items (customers, guests)
4. **Orders Access**: Users can view and create their own orders
5. **Staff/Admin Access**: Staff and admin can view all data

## Next Steps

Once RLS is fixed, we'll build:
- ✅ Profile page (already exists)
- 📝 Orders page (track order history)
- 📊 Admin Dashboard (stats and management)

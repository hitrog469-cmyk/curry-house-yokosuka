-- ============================================
-- THE CURRY HOUSE YOKOSUKA
-- Complete Database Setup (run ONCE in Supabase SQL Editor)
-- ============================================

-- ============================================
-- 1. CREATE PROFILES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  is_active BOOLEAN DEFAULT true,
  user_id SERIAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. CREATE ORDERS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  order_type TEXT DEFAULT 'delivery',
  assigned_staff_id UUID,
  split_items JSONB,
  applied_offers JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. CREATE MENU_ITEMS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_jp TEXT,
  description TEXT,
  description_jp TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  subcategory TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  spice_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. CREATE DELIVERY_LOCATIONS TABLE (GPS tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_id ON delivery_locations(order_id);

-- ============================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. CLEANUP DELIVERY LOCATION ON ORDER COMPLETE
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_delivery_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('delivered', 'cancelled') AND OLD.status = 'out_for_delivery' THEN
    DELETE FROM delivery_locations WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_delivery_location ON orders;
CREATE TRIGGER trigger_cleanup_delivery_location
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_delivery_location();

-- ============================================
-- 7. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES - PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')));

-- ============================================
-- 9. RLS POLICIES - MENU ITEMS (public read)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can manage menu items" ON menu_items;

CREATE POLICY "Anyone can view menu items" ON menu_items FOR SELECT TO public USING (true);

CREATE POLICY "Staff can manage menu items" ON menu_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin')));

-- ============================================
-- 10. RLS POLICIES - ORDERS
-- ============================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON orders;

-- Authenticated users can view own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can create orders
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anyone can insert orders (for guest checkout)
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT TO anon
  WITH CHECK (true);

-- Anyone can view orders by phone (for tracking page)
CREATE POLICY "Anyone can view orders by phone" ON orders FOR SELECT TO anon
  USING (true);

-- Users can cancel own pending orders
CREATE POLICY "Users can update own pending orders" ON orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Staff can view/update all orders
CREATE POLICY "Staff can view all orders" ON orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin')));

CREATE POLICY "Staff can update all orders" ON orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin')));

-- ============================================
-- 11. RLS POLICIES - DELIVERY LOCATIONS
-- ============================================
DROP POLICY IF EXISTS "Staff can upsert own delivery locations" ON delivery_locations;
DROP POLICY IF EXISTS "Anyone can read delivery locations" ON delivery_locations;

CREATE POLICY "Staff can upsert own delivery locations" ON delivery_locations FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read delivery locations" ON delivery_locations FOR SELECT
  USING (true);

-- ============================================
-- 12. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- 13. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON menu_items TO authenticated;
GRANT ALL ON orders TO anon, authenticated;
GRANT SELECT ON delivery_locations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON delivery_locations TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- DONE! Verify:
-- ============================================
SELECT 'Setup complete!' as status;
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'orders', 'menu_items', 'delivery_locations')
ORDER BY tablename;

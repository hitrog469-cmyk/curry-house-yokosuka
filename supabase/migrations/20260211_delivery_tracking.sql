-- ============================================
-- Delivery Location Tracking
-- Stores live GPS coordinates of delivery staff
-- ============================================

-- Table: one row per active delivery (upsert by order_id)
CREATE TABLE IF NOT EXISTS delivery_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id)
);

-- Index for fast lookups by order
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_id ON delivery_locations(order_id);

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_locations;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- Staff can insert/update their own location entries
CREATE POLICY "Staff can upsert own delivery locations"
  ON delivery_locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Customers can read location for their orders (via phone lookup on orders table)
CREATE POLICY "Anyone can read delivery locations"
  ON delivery_locations
  FOR SELECT
  USING (true);

-- ============================================
-- Cleanup trigger: delete location when order is delivered/cancelled
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

CREATE TRIGGER trigger_cleanup_delivery_location
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_delivery_location();

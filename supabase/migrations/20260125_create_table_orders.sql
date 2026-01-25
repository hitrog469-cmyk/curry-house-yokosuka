-- Create table_orders table for QR code ordering system
CREATE TABLE IF NOT EXISTS public.table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL CHECK (table_number >= 1 AND table_number <= 15),
  items JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON public.table_orders(status);
CREATE INDEX IF NOT EXISTS idx_table_orders_created_at ON public.table_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_orders_table_number ON public.table_orders(table_number);

-- Enable Row Level Security
ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert orders (public table ordering)
CREATE POLICY "Anyone can create table orders"
  ON public.table_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read orders (kitchen display needs this)
CREATE POLICY "Anyone can read table orders"
  ON public.table_orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users (staff) can update orders
CREATE POLICY "Only authenticated users can update orders"
  ON public.table_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_table_orders_updated_at ON public.table_orders;
CREATE TRIGGER update_table_orders_updated_at
  BEFORE UPDATE ON public.table_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.table_orders TO authenticated;
GRANT SELECT, INSERT ON public.table_orders TO anon;

-- Add comment
COMMENT ON TABLE public.table_orders IS 'Orders placed via QR code table ordering system';

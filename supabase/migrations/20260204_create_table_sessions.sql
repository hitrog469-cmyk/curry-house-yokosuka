-- Create table_sessions table for session-based ordering
-- This allows customers to add multiple orders to the same session
-- Session stays active until staff marks it as paid/closed

CREATE TABLE IF NOT EXISTS public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL CHECK (table_number >= 1 AND table_number <= 18),
  session_token TEXT NOT NULL UNIQUE, -- Unique token for QR security
  customer_name TEXT,
  party_size INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'bill_requested', 'paid', 'closed')),
  device_id TEXT, -- Optional: track device for session locking
  total_amount INTEGER DEFAULT 0, -- Running total of all session orders
  split_bill BOOLEAN DEFAULT false,
  number_of_splits INTEGER DEFAULT 1,
  split_items JSONB, -- For item-based splitting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE -- When session was marked paid/closed
);

-- Create session_orders table to track individual orders within a session
CREATE TABLE IF NOT EXISTS public.session_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- The items in this specific order batch
  subtotal INTEGER NOT NULL, -- Total for just this order batch
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'served', 'cancelled')),
  printed BOOLEAN DEFAULT false, -- Has kitchen slip been printed?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_number ON public.table_sessions(table_number);
CREATE INDEX IF NOT EXISTS idx_table_sessions_status ON public.table_sessions(status);
CREATE INDEX IF NOT EXISTS idx_table_sessions_token ON public.table_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_table_sessions_created_at ON public.table_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_orders_session_id ON public.session_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_orders_status ON public.session_orders(status);
CREATE INDEX IF NOT EXISTS idx_session_orders_printed ON public.session_orders(printed);
CREATE INDEX IF NOT EXISTS idx_session_orders_created_at ON public.session_orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_orders ENABLE ROW LEVEL SECURITY;

-- Policies for table_sessions
CREATE POLICY "Anyone can create sessions"
  ON public.table_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
  ON public.table_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update sessions"
  ON public.table_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for session_orders
CREATE POLICY "Anyone can create session orders"
  ON public.session_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read session orders"
  ON public.session_orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update session orders"
  ON public.session_orders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp for table_sessions
DROP TRIGGER IF EXISTS update_table_sessions_updated_at ON public.table_sessions;
CREATE TRIGGER update_table_sessions_updated_at
  BEFORE UPDATE ON public.table_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for session_orders
DROP TRIGGER IF EXISTS update_session_orders_updated_at ON public.session_orders;
CREATE TRIGGER update_session_orders_updated_at
  BEFORE UPDATE ON public.session_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update session total when orders change
CREATE OR REPLACE FUNCTION update_session_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the session's total_amount based on all its orders
  UPDATE public.table_sessions
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM public.session_orders
    WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
    AND status != 'cancelled'
  )
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session total
DROP TRIGGER IF EXISTS update_session_total_trigger ON public.session_orders;
CREATE TRIGGER update_session_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.session_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_session_total();

-- Function to check if a table has an active session (for QR locking)
CREATE OR REPLACE FUNCTION get_active_session_for_table(p_table_number INTEGER)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  SELECT id INTO v_session_id
  FROM public.table_sessions
  WHERE table_number = p_table_number
  AND status IN ('active', 'bill_requested')
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate bill split math (sum of splits must equal total)
CREATE OR REPLACE FUNCTION validate_bill_split(
  p_session_id UUID,
  p_split_amounts INTEGER[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total INTEGER;
  v_split_sum INTEGER;
BEGIN
  -- Get session total
  SELECT total_amount INTO v_total
  FROM public.table_sessions
  WHERE id = p_session_id;

  -- Calculate sum of split amounts
  SELECT COALESCE(SUM(amount), 0) INTO v_split_sum
  FROM unnest(p_split_amounts) AS amount;

  -- Return true if sums match
  RETURN v_split_sum = v_total;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.table_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.table_sessions TO anon;

GRANT ALL ON public.session_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.session_orders TO anon;

-- Comments
COMMENT ON TABLE public.table_sessions IS 'Table sessions for continuous ordering - session stays active until paid';
COMMENT ON TABLE public.session_orders IS 'Individual order batches within a table session';
COMMENT ON FUNCTION get_active_session_for_table IS 'Check if table has active session for QR locking';
COMMENT ON FUNCTION validate_bill_split IS 'Validate that split amounts sum to total (returns true/false)';

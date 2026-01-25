-- Create catering_inquiries table
CREATE TABLE IF NOT EXISTS public.catering_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  special_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catering_inquiries_status ON public.catering_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_catering_inquiries_event_date ON public.catering_inquiries(event_date);
CREATE INDEX IF NOT EXISTS idx_catering_inquiries_created_at ON public.catering_inquiries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.catering_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert catering inquiries
CREATE POLICY "Anyone can create catering inquiries"
  ON public.catering_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (admin/staff) can read inquiries
CREATE POLICY "Only authenticated users can read inquiries"
  ON public.catering_inquiries
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update inquiries
CREATE POLICY "Only authenticated users can update inquiries"
  ON public.catering_inquiries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE TRIGGER update_catering_inquiries_updated_at
  BEFORE UPDATE ON public.catering_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.catering_inquiries TO authenticated;
GRANT INSERT ON public.catering_inquiries TO anon;

-- Add comment
COMMENT ON TABLE public.catering_inquiries IS 'Catering and party service inquiries from customers';

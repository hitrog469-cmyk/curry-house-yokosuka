-- Enhance orders and table_orders tables to track offer application and item-based bill splitting

-- Add columns to table_orders
ALTER TABLE table_orders
  ADD COLUMN IF NOT EXISTS split_items JSONB,
  ADD COLUMN IF NOT EXISTS applied_offers JSONB,
  ADD COLUMN IF NOT EXISTS original_total INTEGER,
  ADD COLUMN IF NOT EXISTS discount_total INTEGER;

-- Add columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS split_items JSONB,
  ADD COLUMN IF NOT EXISTS applied_offers JSONB,
  ADD COLUMN IF NOT EXISTS original_total INTEGER,
  ADD COLUMN IF NOT EXISTS discount_total INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN table_orders.split_items IS 'Array of {personName: string, itemIds: string[], subtotal: number}';
COMMENT ON COLUMN table_orders.applied_offers IS 'Array of {offerId: string, offerName: string, itemIds: string[], discountAmount: number, accepted: boolean}';
COMMENT ON COLUMN table_orders.original_total IS 'Total before any discounts in yen';
COMMENT ON COLUMN table_orders.discount_total IS 'Total after discounts applied in yen';

COMMENT ON COLUMN orders.split_items IS 'Array of {personName: string, itemIds: string[], subtotal: number}';
COMMENT ON COLUMN orders.applied_offers IS 'Array of {offerId: string, offerName: string, itemIds: string[], discountAmount: number, accepted: boolean}';
COMMENT ON COLUMN orders.original_total IS 'Total before any discounts in yen';
COMMENT ON COLUMN orders.discount_total IS 'Total after discounts applied in yen';

-- Create indexes for offer tracking queries
CREATE INDEX IF NOT EXISTS idx_table_orders_applied_offers ON table_orders USING GIN (applied_offers);
CREATE INDEX IF NOT EXISTS idx_orders_applied_offers ON orders USING GIN (applied_offers);

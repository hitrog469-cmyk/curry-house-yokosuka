-- Add order_type column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'in-house'));

-- Add order_type column to table_orders table
ALTER TABLE public.table_orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'in-house' CHECK (order_type IN ('delivery', 'in-house'));

-- Add table_number column to orders table for in-house orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS table_number INTEGER;

-- Create index for faster filtering by order type
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_table_orders_order_type ON public.table_orders(order_type);

-- Update existing orders to have delivery type (default)
UPDATE public.orders SET order_type = 'delivery' WHERE order_type IS NULL;

-- Add comment
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: delivery (customer orders) or in-house (QR table orders)';
COMMENT ON COLUMN public.orders.table_number IS 'Table number for in-house orders';

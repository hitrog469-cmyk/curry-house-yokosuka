-- Create notifications table for real-time order alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  target_role TEXT DEFAULT 'all', -- 'reception', 'admin', 'staff', 'customer', 'all'
  sound_type TEXT DEFAULT 'orderUpdate', -- 'newOrder', 'orderUpdate', 'deliveryAlert', 'billRequest'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: users can read their own, staff/admin/reception can read by role
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR target_role = 'all'
    OR target_role IN (
      SELECT role FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id OR target_role = 'all');

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Add reception role to profiles if not exists
DO $$
BEGIN
  -- No ALTER TYPE needed, we use TEXT for role
  NULL;
END $$;

-- Function to auto-notify on new orders
CREATE OR REPLACE FUNCTION notify_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify reception (for table orders and delivery orders)
  INSERT INTO notifications (type, title, message, target_role, sound_type, order_id, metadata)
  VALUES (
    'new_order',
    CASE 
      WHEN NEW.order_type = 'in-house' THEN 'New Table Order - Table ' || COALESCE(NEW.table_number::text, '?')
      ELSE 'New Delivery Order'
    END,
    COALESCE(NEW.customer_name, 'Customer') || ' - ' || NEW.total_amount || ' yen',
    'reception',
    'newOrder',
    NEW.id,
    jsonb_build_object(
      'order_type', COALESCE(NEW.order_type, 'delivery'),
      'table_number', NEW.table_number,
      'customer_name', COALESCE(NEW.customer_name, ''),
      'total_amount', NEW.total_amount
    )
  );

  -- Notify admin
  INSERT INTO notifications (type, title, message, target_role, sound_type, order_id, metadata)
  VALUES (
    'new_order',
    'New Order Received',
    COALESCE(NEW.customer_name, 'Customer') || ' ordered ' || NEW.total_amount || ' yen',
    'admin',
    'orderUpdate',
    NEW.id,
    jsonb_build_object('order_type', COALESCE(NEW.order_type, 'delivery'), 'total_amount', NEW.total_amount)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-notify on order status changes
CREATE OR REPLACE FUNCTION notify_on_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify staff on delivery status changes
    IF NEW.status = 'out_for_delivery' THEN
      INSERT INTO notifications (type, title, message, target_role, sound_type, order_id)
      VALUES (
        'delivery_update',
        'Order Out for Delivery',
        COALESCE(NEW.customer_name, 'Customer') || ' - ' || NEW.delivery_address,
        'staff',
        'deliveryAlert',
        NEW.id
      );
    END IF;

    -- Notify customer on status changes
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, sound_type, order_id)
      VALUES (
        NEW.user_id,
        'status_change',
        'Order Status Updated',
        'Your order is now: ' || REPLACE(NEW.status, '_', ' '),
        'orderUpdate',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on table order events
CREATE OR REPLACE FUNCTION notify_on_table_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify reception of new table order
  INSERT INTO notifications (type, title, message, target_role, sound_type, order_id, metadata)
  VALUES (
    'new_table_order',
    'Table ' || NEW.table_number || ' - New Order',
    COALESCE(NEW.customer_name, 'Guest') || ' (' || COALESCE(NEW.party_size::text, '?') || ' guests) - ' || NEW.total_amount || ' yen',
    'reception',
    'newOrder',
    NEW.id,
    jsonb_build_object(
      'table_number', NEW.table_number,
      'customer_name', COALESCE(NEW.customer_name, ''),
      'total_amount', NEW.total_amount,
      'party_size', COALESCE(NEW.party_size, 1)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_new_order_notify ON orders;
CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_order();

DROP TRIGGER IF EXISTS on_order_update_notify ON orders;
CREATE TRIGGER on_order_update_notify
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_order_update();

DROP TRIGGER IF EXISTS on_new_table_order_notify ON table_orders;
CREATE TRIGGER on_new_table_order_notify
  AFTER INSERT ON table_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_table_order();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;

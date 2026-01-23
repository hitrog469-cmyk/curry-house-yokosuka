-- Auto-assign staff to orders
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CREATE FUNCTION TO GET AVAILABLE STAFF
-- ============================================

CREATE OR REPLACE FUNCTION get_available_staff()
RETURNS TABLE (
  staff_id uuid,
  staff_name text,
  staff_phone text,
  current_orders bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as staff_id,
    p.full_name as staff_name,
    p.phone as staff_phone,
    COUNT(o.id) as current_orders
  FROM profiles p
  LEFT JOIN orders o ON o.assigned_staff_id = p.id
    AND o.status IN ('preparing', 'out_for_delivery')
  WHERE p.role = 'staff'
    AND p.is_active = true
  GROUP BY p.id, p.full_name, p.phone
  ORDER BY current_orders ASC, RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREATE FUNCTION TO AUTO-ASSIGN STAFF
-- ============================================

CREATE OR REPLACE FUNCTION auto_assign_staff_to_order()
RETURNS trigger AS $$
DECLARE
  available_staff_id uuid;
BEGIN
  -- Only auto-assign if no staff is assigned and status is pending
  IF NEW.assigned_staff_id IS NULL AND NEW.status = 'pending' THEN
    -- Get the staff member with fewest active orders
    SELECT staff_id INTO available_staff_id
    FROM get_available_staff()
    LIMIT 1;

    -- If staff found, assign them
    IF available_staff_id IS NOT NULL THEN
      NEW.assigned_staff_id := available_staff_id;
      NEW.status := 'preparing';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE TRIGGER FOR AUTO-ASSIGNMENT
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_assign_staff ON orders;

-- Create trigger that runs BEFORE INSERT
CREATE TRIGGER trigger_auto_assign_staff
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_staff_to_order();

-- ============================================
-- 4. CREATE NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'order_assigned', 'order_reassigned', 'status_change', etc.
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- 5. CREATE FUNCTION TO SEND NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION send_notification(
  p_user_id uuid,
  p_order_id uuid,
  p_type text,
  p_title text,
  p_message text
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, order_id, type, title, message)
  VALUES (p_user_id, p_order_id, p_type, p_title, p_message)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE FUNCTION TO HANDLE STAFF REASSIGNMENT
-- ============================================

CREATE OR REPLACE FUNCTION handle_staff_reassignment()
RETURNS trigger AS $$
DECLARE
  old_staff_name text;
  new_staff_name text;
  order_number text;
BEGIN
  -- Only process if assigned_staff_id changed
  IF OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id THEN

    -- Get order number (use id if no order number field)
    order_number := COALESCE(NEW.order_number::text, NEW.id::text);

    -- Notify old staff (if there was one)
    IF OLD.assigned_staff_id IS NOT NULL THEN
      SELECT full_name INTO old_staff_name FROM profiles WHERE id = OLD.assigned_staff_id;

      PERFORM send_notification(
        OLD.assigned_staff_id,
        NEW.id,
        'order_unassigned',
        'Order Reassigned',
        'Order #' || order_number || ' has been reassigned to another staff member.'
      );
    END IF;

    -- Notify new staff (if there is one)
    IF NEW.assigned_staff_id IS NOT NULL THEN
      SELECT full_name INTO new_staff_name FROM profiles WHERE id = NEW.assigned_staff_id;

      PERFORM send_notification(
        NEW.assigned_staff_id,
        NEW.id,
        'order_assigned',
        'New Order Assigned',
        'Order #' || order_number || ' has been assigned to you.'
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE TRIGGER FOR REASSIGNMENT NOTIFICATIONS
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_staff_reassignment ON orders;

-- Create trigger that runs AFTER UPDATE
CREATE TRIGGER trigger_staff_reassignment
  AFTER UPDATE OF assigned_staff_id ON orders
  FOR EACH ROW
  WHEN (OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id)
  EXECUTE FUNCTION handle_staff_reassignment();

-- ============================================
-- DONE!
-- ============================================

SELECT 'Auto-assignment and notifications setup complete!' as status;

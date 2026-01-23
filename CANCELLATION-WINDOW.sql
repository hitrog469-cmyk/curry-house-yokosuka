-- 15-Minute Order Cancellation Window
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CREATE FUNCTION TO CHECK IF ORDER CAN BE CANCELLED
-- ============================================

CREATE OR REPLACE FUNCTION can_cancel_order(order_id_param uuid)
RETURNS TABLE (
  can_cancel boolean,
  reason text,
  minutes_remaining integer
) AS $$
DECLARE
  order_created_at timestamptz;
  order_status text;
  minutes_since_creation integer;
  cancellation_window_minutes integer := 15;
BEGIN
  -- Get order details
  SELECT created_at, status INTO order_created_at, order_status
  FROM orders
  WHERE id = order_id_param;

  -- Check if order exists
  IF order_created_at IS NULL THEN
    RETURN QUERY SELECT false, 'Order not found'::text, 0::integer;
    RETURN;
  END IF;

  -- Check if order is already cancelled or delivered
  IF order_status IN ('cancelled', 'delivered') THEN
    RETURN QUERY SELECT false, 'Order is already ' || order_status::text, 0::integer;
    RETURN;
  END IF;

  -- Calculate minutes since order creation
  minutes_since_creation := EXTRACT(EPOCH FROM (NOW() - order_created_at)) / 60;

  -- Check if within cancellation window
  IF minutes_since_creation <= cancellation_window_minutes THEN
    RETURN QUERY SELECT
      true,
      'Order can be cancelled'::text,
      (cancellation_window_minutes - minutes_since_creation)::integer;
  ELSE
    RETURN QUERY SELECT
      false,
      'Cancellation window expired. Please call restaurant to cancel.'::text,
      0::integer;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREATE FUNCTION TO CANCEL ORDER
-- ============================================

CREATE OR REPLACE FUNCTION cancel_order(
  order_id_param uuid,
  user_id_param uuid,
  cancellation_reason text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text
) AS $$
DECLARE
  order_user_id uuid;
  order_status text;
  can_cancel_result record;
BEGIN
  -- Get order details
  SELECT user_id, status INTO order_user_id, order_status
  FROM orders
  WHERE id = order_id_param;

  -- Check if order exists
  IF order_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Order not found'::text;
    RETURN;
  END IF;

  -- Check if user owns the order (or is admin/staff)
  IF order_user_id != user_id_param THEN
    -- Check if user is admin or staff
    DECLARE
      user_role text;
    BEGIN
      SELECT role INTO user_role FROM profiles WHERE id = user_id_param;
      IF user_role NOT IN ('admin', 'staff') THEN
        RETURN QUERY SELECT false, 'You are not authorized to cancel this order'::text;
        RETURN;
      END IF;
    END;
  END IF;

  -- Check if order can be cancelled
  SELECT * INTO can_cancel_result FROM can_cancel_order(order_id_param);

  IF NOT can_cancel_result.can_cancel AND user_role NOT IN ('admin', 'staff') THEN
    RETURN QUERY SELECT false, can_cancel_result.reason::text;
    RETURN;
  END IF;

  -- Cancel the order
  UPDATE orders
  SET
    status = 'cancelled',
    notes = COALESCE(notes || ' | ', '') ||
            'Cancelled at ' || NOW()::text ||
            COALESCE(' - Reason: ' || cancellation_reason, '')
  WHERE id = order_id_param;

  -- Send notification to customer
  PERFORM send_notification(
    order_user_id,
    order_id_param,
    'order_cancelled',
    'Order Cancelled',
    'Your order has been cancelled successfully.'
  );

  -- Send notification to assigned staff (if any)
  DECLARE
    assigned_staff uuid;
  BEGIN
    SELECT assigned_staff_id INTO assigned_staff FROM orders WHERE id = order_id_param;
    IF assigned_staff IS NOT NULL THEN
      PERFORM send_notification(
        assigned_staff,
        order_id_param,
        'order_cancelled',
        'Order Cancelled',
        'Order #' || order_id_param::text || ' has been cancelled by customer.'
      );
    END IF;
  END;

  RETURN QUERY SELECT true, 'Order cancelled successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION can_cancel_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order(uuid, uuid, text) TO authenticated;

-- ============================================
-- DONE!
-- ============================================

SELECT 'Cancellation window functions created successfully!' as status;

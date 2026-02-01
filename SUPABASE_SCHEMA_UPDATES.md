# Supabase Database Schema Updates

## Required Database Changes for Bill Splitting & Table Ordering

Run these SQL commands in your Supabase SQL Editor to add support for the new table ordering and bill splitting features.

---

## 1. Update `orders` Table

Add columns for in-house dining, party size, and bill splitting:

```sql
-- Add new columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery',
ADD COLUMN IF NOT EXISTS table_number INTEGER,
ADD COLUMN IF NOT EXISTS party_size INTEGER,
ADD COLUMN IF NOT EXISTS split_bill BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS number_of_splits INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add check constraint to ensure valid order types
ALTER TABLE orders
ADD CONSTRAINT orders_order_type_check
CHECK (order_type IN ('delivery', 'in-house'));

-- Add check constraint for table numbers (1-18)
ALTER TABLE orders
ADD CONSTRAINT orders_table_number_check
CHECK (table_number IS NULL OR (table_number >= 1 AND table_number <= 18));

-- Add check constraint for party size
ALTER TABLE orders
ADD CONSTRAINT orders_party_size_check
CHECK (party_size IS NULL OR party_size >= 1);

-- Add check constraint for number of splits
ALTER TABLE orders
ADD CONSTRAINT orders_number_of_splits_check
CHECK (number_of_splits >= 1 AND number_of_splits <= 20);
```

---

## 2. Update `table_orders` Table

Add columns for customer info and bill splitting:

```sql
-- Add new columns to table_orders table
ALTER TABLE table_orders
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS party_size INTEGER,
ADD COLUMN IF NOT EXISTS split_bill BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS number_of_splits INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS amount_per_split DECIMAL(10,2);

-- Add check constraint for party size
ALTER TABLE table_orders
ADD CONSTRAINT table_orders_party_size_check
CHECK (party_size IS NULL OR party_size >= 1);

-- Add check constraint for number of splits
ALTER TABLE table_orders
ADD CONSTRAINT table_orders_number_of_splits_check
CHECK (number_of_splits >= 1 AND number_of_splits <= 20);
```

---

## 3. Create Index for Performance

Add indexes for faster queries on table orders:

```sql
-- Create index on order_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- Create index on table_number for quick table lookup
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);

-- Create composite index for in-house orders
CREATE INDEX IF NOT EXISTS idx_orders_inhouse ON orders(order_type, table_number, created_at DESC)
WHERE order_type = 'in-house';
```

---

## 4. Update Row-Level Security (RLS) Policies

Ensure proper access control for the new fields:

```sql
-- Allow authenticated users to read their own table orders
CREATE POLICY "Users can view their table orders" ON table_orders
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow staff to update table orders
CREATE POLICY "Staff can update table orders" ON table_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('staff', 'admin')
  )
);
```

---

## 5. Verify Changes

Run this query to verify all columns were added successfully:

```sql
-- Check orders table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('order_type', 'table_number', 'party_size', 'split_bill', 'number_of_splits', 'payment_status')
ORDER BY ordinal_position;

-- Check table_orders table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'table_orders'
AND column_name IN ('customer_name', 'party_size', 'split_bill', 'number_of_splits', 'amount_per_split')
ORDER BY ordinal_position;
```

---

## Field Descriptions

### `orders` table new fields:

| Field | Type | Description |
|-------|------|-------------|
| `order_type` | TEXT | Either 'delivery' or 'in-house' |
| `table_number` | INTEGER | Table number (1-18) for in-house orders |
| `party_size` | INTEGER | Number of people in the party |
| `split_bill` | BOOLEAN | Whether the bill should be split |
| `number_of_splits` | INTEGER | How many ways to split the bill (1-20) |
| `payment_status` | TEXT | Payment status: 'pending', 'paid', 'failed' |

### `table_orders` table new fields:

| Field | Type | Description |
|-------|------|-------------|
| `customer_name` | TEXT | Name of the customer placing the order |
| `party_size` | INTEGER | Number of people in the party |
| `split_bill` | BOOLEAN | Whether the bill should be split |
| `number_of_splits` | INTEGER | How many ways to split the bill |
| `amount_per_split` | DECIMAL | Calculated amount each person pays |

---

## Migration Notes

1. **Existing Data**: All existing orders will have `order_type = 'delivery'` by default
2. **Nullable Fields**: `table_number`, `party_size`, and `customer_name` are nullable to support both delivery and in-house orders
3. **Constraints**: Check constraints ensure data integrity (e.g., table numbers 1-18, valid order types)
4. **Performance**: Indexes added for common query patterns (filtering by order type, table number)

---

## Testing Queries

After running the migrations, test with these queries:

```sql
-- Get all in-house orders for a specific table
SELECT * FROM orders
WHERE order_type = 'in-house'
AND table_number = 5
ORDER BY created_at DESC;

-- Get all orders with split bills
SELECT
  id,
  customer_name,
  table_number,
  total_amount,
  number_of_splits,
  (total_amount / number_of_splits) as amount_per_person
FROM orders
WHERE split_bill = true
AND order_type = 'in-house'
ORDER BY created_at DESC;

-- Revenue by order type
SELECT
  order_type,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue
FROM orders
WHERE status = 'delivered'
GROUP BY order_type;
```

---

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Remove constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_table_number_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_party_size_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_number_of_splits_check;
ALTER TABLE table_orders DROP CONSTRAINT IF EXISTS table_orders_party_size_check;
ALTER TABLE table_orders DROP CONSTRAINT IF EXISTS table_orders_number_of_splits_check;

-- Remove indexes
DROP INDEX IF EXISTS idx_orders_order_type;
DROP INDEX IF EXISTS idx_orders_table_number;
DROP INDEX IF EXISTS idx_orders_inhouse;

-- Remove columns (WARNING: This will delete data!)
ALTER TABLE orders DROP COLUMN IF EXISTS order_type;
ALTER TABLE orders DROP COLUMN IF EXISTS table_number;
ALTER TABLE orders DROP COLUMN IF EXISTS party_size;
ALTER TABLE orders DROP COLUMN IF EXISTS split_bill;
ALTER TABLE orders DROP COLUMN IF EXISTS number_of_splits;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status;

ALTER TABLE table_orders DROP COLUMN IF EXISTS customer_name;
ALTER TABLE table_orders DROP COLUMN IF EXISTS party_size;
ALTER TABLE table_orders DROP COLUMN IF EXISTS split_bill;
ALTER TABLE table_orders DROP COLUMN IF EXISTS number_of_splits;
ALTER TABLE table_orders DROP COLUMN IF EXISTS amount_per_split;
```

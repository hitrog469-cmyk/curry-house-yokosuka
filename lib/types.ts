// Database Types for The Curry House Yokosuka

// Table Session - represents a customer's entire dining experience at a table
export interface TableSession {
  id: string
  table_number: number
  session_token: string
  customer_name: string | null
  party_size: number
  status: 'active' | 'bill_requested' | 'paid' | 'closed'
  device_id: string | null
  total_amount: number
  split_bill: boolean
  number_of_splits: number
  split_items: SplitItem[] | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

// Individual order within a session (e.g., initial order, add-on drinks, etc.)
export interface SessionOrder {
  id: string
  session_id: string
  items: OrderItem[]
  subtotal: number
  status: 'pending' | 'confirmed' | 'preparing' | 'served' | 'cancelled'
  printed: boolean
  created_at: string
  updated_at: string
}

// Item in an order
export interface OrderItem {
  id: string
  name: string
  nameJp?: string
  price: number
  quantity: number
  spiceLevel?: string
  addOns?: AddOn[]
  variation?: Variation
  notes?: string
}

// Add-on for an item
export interface AddOn {
  name: string
  price: number
}

// Variation for an item (size, portion, etc.)
export interface Variation {
  name: string
  price: number
}

// Split item assignment for by-items splitting
export interface SplitItem {
  personName: string
  itemIds: string[]
  subtotal: number
}

// Staff Panel Table Status
export type TableStatus =
  | 'available'      // Grey - No active session
  | 'new_order'      // Red (pulsing) - New order needs printing
  | 'preparing'      // Blue - Kitchen is working
  | 'add_on'         // Orange - Additional items added (needs printing)
  | 'bill_requested' // Yellow/Gold - Customer wants to pay
  | 'served'         // Green - All items served

// Table tile data for Staff Panel
export interface TableTile {
  tableNumber: number
  status: TableStatus
  session: TableSession | null
  unprintedOrders: SessionOrder[]
  allOrders: SessionOrder[]
  hasUnprintedItems: boolean
}

// Kitchen Slip data for printing
export interface KitchenSlip {
  tableNumber: number
  orderId: string
  items: OrderItem[]
  timestamp: string
  isAddOn: boolean // true if this is an add-on order
}

// Final Receipt data for printing
export interface FinalReceipt {
  tableNumber: number
  sessionId: string
  customerName: string | null
  partySize: number
  allItems: OrderItem[]
  subtotal: number
  tax: number
  total: number
  splitDetails?: {
    numberOfSplits: number
    amountPerPerson: number
    remainder: number // Extra yen assigned to first person
    splitItems?: SplitItem[]
  }
  timestamp: string
}

// QR Code with security token
export interface SecureQRCode {
  tableNumber: number
  token: string
  url: string
  isLocked: boolean // true if session is active
  activeSessionId?: string
}

// Menu item from database
export interface MenuItem {
  id: string
  name: string
  nameJp?: string
  price: number
  category: string
  description?: string
  image?: string
  addOns?: AddOn[]
  variations?: Variation[]
  spiceLevel?: boolean
  isRecommended?: boolean
  isAvailable?: boolean
}

// Daily special
export interface DailySpecial {
  id: string
  menu_item_id: string
  menu_item_name: string
  original_price: number
  special_price: number
  discount_percentage: number
  display_text?: string
  is_active: boolean
  valid_date: string
  valid_from?: string
  valid_until?: string
}

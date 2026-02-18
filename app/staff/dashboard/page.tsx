'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { Bell, ChefHat, CheckCircle, DollarSign, Printer, RefreshCw, Volume2, VolumeX, LayoutGrid, Columns3 } from 'lucide-react'
import ToggleTabs from '@/components/ui/ToggleTabs'

// Constants
const TOTAL_TABLES = 18
const KITCHEN_DELAY_MINUTES = 20

// Status colors matching the blueprint
const STATUS_COLORS = {
  available: 'bg-gray-700 border-gray-600', // Grey - Empty
  new_order: 'bg-red-600 border-red-500 animate-pulse', // Red pulsing - New order
  preparing: 'bg-blue-600 border-blue-500', // Blue - Kitchen working
  add_on: 'bg-orange-500 border-orange-400 animate-pulse', // Orange pulsing - Add-on needs print
  bill_requested: 'bg-yellow-500 border-yellow-400', // Gold - Wants to pay
  served: 'bg-green-600 border-green-500', // Green - All served
  delayed: 'bg-purple-600 border-purple-500 animate-pulse', // Purple pulsing - Kitchen delay alert
} as const

type TableStatus = keyof typeof STATUS_COLORS

interface OrderItem {
  item_id?: string
  name: string
  nameJp?: string
  quantity: number
  price: number
  subtotal?: number
  spiceLevel?: string
  addOns?: { name: string; price: number }[]
  variation?: { name: string; price: number }
}

interface SessionOrder {
  id: string
  session_id: string
  items: OrderItem[]
  subtotal: number
  status: string
  printed: boolean
  created_at: string
  updated_at: string
}

interface TableSession {
  id: string
  table_number: number
  session_token: string
  customer_name: string | null
  party_size: number
  status: string
  total_amount: number
  split_bill: boolean
  number_of_splits: number
  created_at: string
  updated_at: string
}

// Legacy table_orders support (until migration complete)
interface LegacyOrder {
  id: string
  table_number: number
  items: OrderItem[]
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  customer_name?: string
  party_size?: number
  split_bill?: boolean
  number_of_splits?: number
}

interface TableTile {
  tableNumber: number
  status: TableStatus
  session: TableSession | null
  legacyOrders: LegacyOrder[] // Support for existing table_orders
  unprintedCount: number
  totalAmount: number
  customerName: string | null
  partySize: number
  isDelayed: boolean
  oldestOrderTime: string | null
}

export default function StaffDashboardPage() {
  const [tables, setTables] = useState<TableTile[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline'>('grid')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const supabase = getSupabaseBrowserClient()

  // Load sound preference
  useEffect(() => {
    const saved = localStorage.getItem('staff_sound')
    if (saved === 'false') setSoundEnabled(false)
  }, [])

  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    localStorage.setItem('staff_sound', String(newState))
  }

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
  }, [soundEnabled])

  // Calculate table status from orders
  const calculateTableStatus = (orders: LegacyOrder[]): TableStatus => {
    if (orders.length === 0) return 'available'

    const hasUnprinted = orders.some(o => o.status === 'pending')
    const hasPreparing = orders.some(o => o.status === 'preparing')
    const allCompleted = orders.every(o => o.status === 'completed')

    // Check for kitchen delay (any order preparing for > 20 mins)
    const hasDelay = orders.some(o => {
      if (o.status !== 'preparing') return false
      const orderTime = new Date(o.created_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60)
      return diffMinutes > KITCHEN_DELAY_MINUTES
    })

    if (hasDelay) return 'delayed'
    if (hasUnprinted) return 'new_order'
    if (hasPreparing) return 'preparing'
    if (allCompleted) return 'served'

    return 'preparing'
  }

  // Fetch all table data
  const fetchTableData = useCallback(async () => {
    if (!supabase) return
    try {
      // Fetch from legacy table_orders (current system)
      const { data: legacyOrders, error } = await supabase
        .from('table_orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'completed'])
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group orders by table
      const ordersByTable: { [key: number]: LegacyOrder[] } = {}
      for (let i = 1; i <= TOTAL_TABLES; i++) {
        ordersByTable[i] = []
      }

      (legacyOrders || []).forEach(order => {
        if (order.table_number >= 1 && order.table_number <= TOTAL_TABLES) {
          // Only include non-cancelled orders from last 4 hours
          const orderTime = new Date(order.created_at)
          const hoursSinceOrder = (Date.now() - orderTime.getTime()) / (1000 * 60 * 60)
          if (hoursSinceOrder < 4 && order.status !== 'cancelled') {
            ordersByTable[order.table_number].push(order)
          }
        }
      })

      // Build table tiles
      const tableTiles: TableTile[] = []
      for (let i = 1; i <= TOTAL_TABLES; i++) {
        const tableOrders = ordersByTable[i]
        const unprintedOrders = tableOrders.filter(o => o.status === 'pending')
        const oldestOrder = tableOrders[tableOrders.length - 1]

        // Check for delay
        const isDelayed = tableOrders.some(o => {
          if (o.status !== 'preparing') return false
          const orderTime = new Date(o.created_at)
          const diffMinutes = (Date.now() - orderTime.getTime()) / (1000 * 60)
          return diffMinutes > KITCHEN_DELAY_MINUTES
        })

        tableTiles.push({
          tableNumber: i,
          status: calculateTableStatus(tableOrders),
          session: null, // Will be populated when sessions are implemented
          legacyOrders: tableOrders,
          unprintedCount: unprintedOrders.length,
          totalAmount: tableOrders.reduce((sum, o) => sum + o.total_amount, 0),
          customerName: tableOrders[0]?.customer_name || null,
          partySize: tableOrders[0]?.party_size || 0,
          isDelayed,
          oldestOrderTime: oldestOrder?.created_at || null,
        })
      }

      setTables(tableTiles)
    } catch (error) {
      console.error('Error fetching table data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Print kitchen slip for a table's pending orders
  const printKitchenSlip = (table: TableTile) => {
    const unprintedOrders = table.legacyOrders.filter(o => o.status === 'pending')
    if (unprintedOrders.length === 0) return

    const printWindow = window.open('', '', 'width=350,height=600')
    if (!printWindow) return

    // Combine all items from unprinted orders
    const allItems = unprintedOrders.flatMap(o => o.items)
    const isAddOn = table.legacyOrders.some(o => o.status !== 'pending')

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kitchen Slip - Table ${table.tableNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 10px;
            font-size: 14px;
            max-width: 80mm;
          }
          .header {
            text-align: center;
            border-bottom: 3px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h1 {
            font-size: 16px;
            margin-bottom: 5px;
          }
          .add-on-badge {
            background: #f97316;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: inline-block;
            margin-bottom: 5px;
          }
          .table-number {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            border: 4px solid #000;
            padding: 10px;
          }
          .timestamp {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
          }
          .items {
            border-top: 2px dashed #000;
            border-bottom: 2px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-name {
            flex: 1;
            font-weight: bold;
          }
          .item-details {
            font-size: 11px;
            color: #666;
            margin-left: 10px;
          }
          .item-qty {
            font-size: 24px;
            font-weight: bold;
            min-width: 50px;
            text-align: right;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍛 KITCHEN SLIP</h1>
          ${isAddOn ? '<span class="add-on-badge">+ ADD-ON ORDER</span>' : '<span style="font-size:12px">NEW ORDER</span>'}
        </div>

        <div class="table-number">
          ${table.tableNumber}
        </div>

        <div class="timestamp">
          ${new Date().toLocaleString('ja-JP')}
        </div>

        <div class="items">
          ${allItems.map(item => `
            <div class="item">
              <div>
                <div class="item-name">${item.name}</div>
                ${item.spiceLevel ? `<div class="item-details">🌶️ ${item.spiceLevel}</div>` : ''}
                ${item.addOns?.length ? `<div class="item-details">+ ${item.addOns.map(a => a.name).join(', ')}</div>` : ''}
                ${item.variation ? `<div class="item-details">• ${item.variation.name}</div>` : ''}
              </div>
              <div class="item-qty">×${item.quantity}</div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Order ID: ${unprintedOrders[0].id.slice(0, 8)}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }

    // Mark orders as preparing after print
    markOrdersAsPreparing(unprintedOrders.map(o => o.id))
  }

  // Print final receipt for bill
  const printFinalReceipt = (table: TableTile) => {
    const printWindow = window.open('', '', 'width=350,height=800')
    if (!printWindow) return

    const allItems = table.legacyOrders.flatMap(o => o.items)
    const subtotal = table.totalAmount
    const tax = Math.floor(subtotal * 0.1) // 10% tax
    const total = subtotal + tax

    // Bill split calculation
    let splitInfo = ''
    if (table.legacyOrders[0]?.split_bill && table.legacyOrders[0]?.number_of_splits) {
      const splits = table.legacyOrders[0].number_of_splits
      const perPerson = Math.ceil(total / splits)
      const remainder = total - (perPerson * (splits - 1))
      splitInfo = `
        <div class="split-info">
          <div style="font-weight:bold;margin-bottom:5px;">📋 BILL SPLIT (${splits} people)</div>
          <div>Per Person: ${formatPrice(perPerson)}</div>
          ${remainder !== perPerson ? `<div style="font-size:11px;color:#666;">*First person pays ${formatPrice(remainder)}</div>` : ''}
        </div>
      `
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Table ${table.tableNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 15px;
            font-size: 12px;
            max-width: 80mm;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 10px;
            color: #666;
          }
          .divider {
            border-top: 2px dashed #000;
            margin: 10px 0;
          }
          .table-info {
            text-align: center;
            margin: 10px 0;
          }
          .table-number {
            font-size: 24px;
            font-weight: bold;
          }
          .customer-info {
            font-size: 11px;
            color: #666;
          }
          .items {
            margin: 15px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            width: 30px;
            text-align: center;
          }
          .item-price {
            width: 70px;
            text-align: right;
          }
          .totals {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            margin-top: 5px;
            padding-top: 5px;
          }
          .split-info {
            background: #f5f5f5;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
          }
          .footer .thank-you {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍛 THE CURRY HOUSE</h1>
          <p>YOKOSUKA</p>
          <p>ザ・カリーハウス横須賀</p>
        </div>

        <div class="divider"></div>

        <div class="table-info">
          <div class="table-number">TABLE ${table.tableNumber}</div>
          ${table.customerName ? `<div class="customer-info">${table.customerName} | ${table.partySize} guests</div>` : ''}
          <div class="customer-info">${new Date().toLocaleString('ja-JP')}</div>
        </div>

        <div class="divider"></div>

        <div class="items">
          ${allItems.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">×${item.quantity}</span>
              <span class="item-price">${formatPrice(item.price * item.quantity)}</span>
            </div>
            ${item.addOns?.map(addon => `
              <div class="item" style="font-size:10px;color:#666;">
                <span class="item-name">　+ ${addon.name}</span>
                <span class="item-qty"></span>
                <span class="item-price">${formatPrice(addon.price)}</span>
              </div>
            `).join('') || ''}
          `).join('')}
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal / 小計</span>
            <span>${formatPrice(subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%) / 消費税</span>
            <span>${formatPrice(tax)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL / 合計</span>
            <span>${formatPrice(total)}</span>
          </div>
        </div>

        ${splitInfo}

        <div class="footer">
          <div class="thank-you">Thank You! ありがとうございました!</div>
          <p>Please visit us again!</p>
          <p>またのお越しをお待ちしております</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  // Mark orders as preparing
  const markOrdersAsPreparing = async (orderIds: string[]) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('table_orders')
        .update({ status: 'preparing' })
        .in('id', orderIds)

      if (error) throw error
      fetchTableData()
    } catch (error) {
      console.error('Error updating orders:', error)
    }
  }

  // Close/reset table session
  const closeTable = async (tableNumber: number) => {
    if (!supabase) return
    try {
      // Mark all orders for this table as completed
      const { error } = await supabase
        .from('table_orders')
        .update({ status: 'completed' })
        .eq('table_number', tableNumber)
        .in('status', ['pending', 'preparing'])

      if (error) throw error

      setSelectedTable(null)
      fetchTableData()
    } catch (error) {
      console.error('Error closing table:', error)
    }
  }

  // Real-time subscription
  useEffect(() => {
    fetchTableData()

    if (!supabase) return

    const channel = supabase
      .channel('staff_dashboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_orders'
        },
        (payload) => {
          console.log('Order change:', payload)
          if (payload.eventType === 'INSERT') {
            playNotificationSound()
          }
          fetchTableData()
        }
      )
      .subscribe()

    // Update time every minute for delay checks
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
      fetchTableData() // Refresh to update delay status
    }, 60000)

    return () => {
      supabase?.removeChannel(channel)
      clearInterval(timeInterval)
    }
  }, [fetchTableData, playNotificationSound, supabase])

  // Get the selected table's data
  const selectedTableData = selectedTable ? tables.find(t => t.tableNumber === selectedTable) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Staff Panel...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 text-white min-h-[calc(100vh-56px)]">
      {/* Hidden audio for notifications */}
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      {/* Compact Header with Clock + Status Badges + Legend */}
      <div className="bg-gray-800 border-b border-gray-700 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">Kitchen Counter</h1>
              <div className="flex gap-2">
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                  {tables.filter(t => t.status === 'new_order').length} NEW
                </span>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">
                  {tables.filter(t => t.status === 'preparing').length} COOKING
                </span>
              </div>
            </div>
            <div className="text-lg font-mono text-gray-400">
              {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-700"></span> Empty</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600 animate-pulse"></span> New</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500"></span> Add-on</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600"></span> Preparing</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> Bill</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-600 animate-pulse"></span> Delayed</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Stats Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-800 rounded-xl p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">New Orders</p>
                <p className="text-2xl font-black text-red-400">{tables.filter(t => t.status === 'new_order').length}</p>
              </div>
              <Bell className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Preparing</p>
                <p className="text-2xl font-black text-blue-400">{tables.filter(t => t.status === 'preparing' || t.status === 'delayed').length}</p>
              </div>
              <ChefHat className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Served</p>
                <p className="text-2xl font-black text-green-400">{tables.filter(t => t.status === 'served').length}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Revenue</p>
                <p className="text-2xl font-black text-emerald-400">{formatPrice(tables.reduce((sum, t) => sum + t.totalAmount, 0))}</p>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions + View Toggle */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => {
              tables.forEach(t => {
                if (t.unprintedCount > 0) printKitchenSlip(t)
              })
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-all text-sm"
          >
            <Printer className="w-4 h-4" /> Print All Pending
          </button>
          <button
            onClick={() => fetchTableData()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
              soundEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-700/50 hover:bg-gray-600 text-gray-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>

          <div className="ml-auto">
            <ToggleTabs
              tabs={[
                { id: 'grid', label: 'Grid', icon: LayoutGrid },
                { id: 'pipeline', label: 'Pipeline', icon: Columns3 },
              ]}
              activeTab={viewMode}
              onChange={(id) => setViewMode(id as 'grid' | 'pipeline')}
              size="sm"
            />
          </div>
        </div>

        {/* Pipeline View */}
        {viewMode === 'pipeline' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { status: 'new_order' as const, label: 'New Orders', color: 'border-red-500 bg-red-500/10', textColor: 'text-red-400' },
              { status: 'preparing' as const, label: 'Preparing', color: 'border-blue-500 bg-blue-500/10', textColor: 'text-blue-400' },
              { status: 'served' as const, label: 'Served', color: 'border-green-500 bg-green-500/10', textColor: 'text-green-400' },
              { status: 'bill_requested' as const, label: 'Bill Requested', color: 'border-yellow-500 bg-yellow-500/10', textColor: 'text-yellow-400' },
            ].map(col => {
              const colTables = tables.filter(t => t.status === col.status || (col.status === 'preparing' && t.status === 'delayed'))
              return (
                <div key={col.status} className={`rounded-xl border-t-4 ${col.color} p-3`}>
                  <h3 className={`text-sm font-bold ${col.textColor} mb-3 flex items-center justify-between`}>
                    {col.label}
                    <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs">{colTables.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {colTables.length === 0 ? (
                      <p className="text-gray-600 text-xs text-center py-4">None</p>
                    ) : (
                      colTables.map(t => (
                        <button
                          key={t.tableNumber}
                          onClick={() => { setSelectedTable(t.tableNumber); setViewMode('grid') }}
                          className={`w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-all ${
                            t.isDelayed ? 'ring-2 ring-purple-500 animate-pulse' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg font-black">T{t.tableNumber}</span>
                            {t.unprintedCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{t.unprintedCount}</span>
                            )}
                          </div>
                          {t.customerName && <p className="text-xs text-gray-400 truncate">{t.customerName}</p>}
                          <p className="text-sm font-bold text-emerald-400">{formatPrice(t.totalAmount)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table Grid - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {tables.map(table => (
                <button
                  key={table.tableNumber}
                  onClick={() => setSelectedTable(table.tableNumber)}
                  className={`
                    aspect-square rounded-xl border-4 flex flex-col items-center justify-center
                    transition-all duration-200 relative
                    ${STATUS_COLORS[table.status]}
                    ${selectedTable === table.tableNumber ? 'ring-4 ring-white scale-105' : 'hover:scale-105'}
                  `}
                >
                  {/* Table number */}
                  <span className="text-3xl md:text-4xl font-black">
                    {table.tableNumber}
                  </span>

                  {/* Status indicator */}
                  {table.status !== 'available' && (
                    <span className="text-xs mt-1 font-semibold">
                      {table.status === 'new_order' && '🆕 NEW'}
                      {table.status === 'preparing' && '🍳'}
                      {table.status === 'add_on' && '+ ADD'}
                      {table.status === 'bill_requested' && '💰'}
                      {table.status === 'served' && '✓'}
                      {table.status === 'delayed' && '⚠️ LATE'}
                    </span>
                  )}

                  {/* Unprinted badge */}
                  {table.unprintedCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                      {table.unprintedCount}
                    </span>
                  )}

                  {/* Total amount for active tables */}
                  {table.totalAmount > 0 && (
                    <span className="absolute bottom-1 text-[10px] font-semibold opacity-80">
                      {formatPrice(table.totalAmount)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Order Detail Panel - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-4 sticky top-4">
              {selectedTableData ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      Table {selectedTableData.tableNumber}
                    </h2>
                    <button
                      onClick={() => setSelectedTable(null)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {selectedTableData.customerName && (
                    <div className="text-gray-400 text-sm mb-2">
                      👤 {selectedTableData.customerName} ({selectedTableData.partySize} guests)
                    </div>
                  )}

                  {/* Orders list */}
                  {selectedTableData.legacyOrders.length > 0 ? (
                    <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto">
                      {selectedTableData.legacyOrders.map(order => (
                        <div
                          key={order.id}
                          className={`p-3 rounded-lg ${
                            order.status === 'pending'
                              ? 'bg-red-900/50 border border-red-500'
                              : 'bg-gray-700/50'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              order.status === 'pending' ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                              {order.status === 'pending' ? '🆕 UNPRINTED' : '🍳 COOKING'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-1">
                              <span>
                                {item.name}
                                {item.spiceLevel && <span className="text-orange-400 ml-1">🌶️{item.spiceLevel}</span>}
                              </span>
                              <span className="font-bold">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active orders
                    </div>
                  )}

                  {/* Total */}
                  {selectedTableData.totalAmount > 0 && (
                    <div className="text-xl font-bold text-center py-3 border-t border-gray-700 mb-4">
                      Total: {formatPrice(selectedTableData.totalAmount)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {selectedTableData.unprintedCount > 0 && (
                      <button
                        onClick={() => printKitchenSlip(selectedTableData)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span className="text-2xl">🖨️</span>
                        Print Kitchen Slip
                      </button>
                    )}

                    {selectedTableData.status !== 'available' && (
                      <>
                        <button
                          onClick={() => printFinalReceipt(selectedTableData)}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          <span className="text-xl">🧾</span>
                          Print Bill
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Close Table ${selectedTableData.tableNumber}? This will mark all orders as complete.`)) {
                              closeTable(selectedTableData.tableNumber)
                            }
                          }}
                          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          <span className="text-xl">✅</span>
                          Paid - Close Table
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">👆</div>
                  <p className="text-lg">Select a table to view details</p>
                  <p className="text-sm mt-2">Tap a colored tile to see orders</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

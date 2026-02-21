'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { Printer, LogOut, RefreshCw, Clock, Users, UtensilsCrossed } from 'lucide-react'

// ── Types ────────────────────────────────────────────────
interface OrderItem {
  name: string
  quantity: number
  price: number
  spiceLevel?: string
  addOns?: { name: string; price: number }[]
  variation?: { name: string; price: number }
}

interface TableOrder {
  id: string
  table_number: number
  items: OrderItem[]
  total_amount: number
  status: string
  created_at: string
  customer_name?: string
  party_size?: number
  split_bill?: boolean
  number_of_splits?: number
}

interface DeliveryOrder {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  items: OrderItem[]
  total_amount: number
  status: string
  order_type: string
  created_at: string
  payment_method?: string
  payment_status?: string
}

interface TableSummary {
  tableNumber: number
  isOccupied: boolean
  orders: TableOrder[]
  totalAmount: number
  customerName: string
  partySize: number
  latestOrderTime: string | null
}

const TOTAL_TABLES = 18

// ── Bill Print Function ──────────────────────────────────
function printBill(table: TableSummary | null, delivery: DeliveryOrder | null) {
  const isDelivery = !!delivery
  const items = isDelivery ? delivery!.items : table!.orders.flatMap(o => o.items)
  const total = isDelivery ? delivery!.total_amount : table!.totalAmount
  const customerName = isDelivery ? delivery!.customer_name : table!.customerName
  const tableNum = isDelivery ? null : table!.tableNumber
  const partySize = isDelivery ? null : table!.partySize
  const orderId = isDelivery ? delivery!.id : table!.orders[0]?.id || ''
  const createdAt = isDelivery ? delivery!.created_at : (table!.latestOrderTime || new Date().toISOString())

  // Split bill info
  let splitInfo = ''
  if (!isDelivery && table) {
    const firstOrder = table.orders[0]
    if (firstOrder?.split_bill && firstOrder?.number_of_splits && firstOrder.number_of_splits > 1) {
      const splits = firstOrder.number_of_splits
      const perPerson = Math.ceil(total / splits)
      splitInfo = `
        <div class="split-section">
          <div style="font-weight:bold;margin-bottom:4px;">BILL SPLIT (${splits} people)</div>
          <div style="font-size:11pt;font-weight:bold;">Per Person: ${formatPrice(perPerson)}</div>
        </div>
      `
    }
  }

  const printWindow = window.open('', '', 'width=220,height=600')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html><head><title></title>
    <meta name="viewport" content="width=220">
    <style>
      @page { size: 58mm auto; margin: 0mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html { width: 58mm; margin: 0mm; padding: 0; background: white; }
      body { width: 58mm; margin: 0mm; padding: 2mm 1.5mm; font-family: 'Courier New', monospace; font-size: 8pt; background: white; }
      .header { text-align: center; margin-bottom: 5px; }
      .header h1 { font-size: 10pt; margin-bottom: 2px; }
      .header p { font-size: 7pt; color: #666; }
      .divider { border-top: 2px dashed #000; margin: 4px 0; }
      .info { text-align: center; margin: 4px 0; }
      .table-num { font-size: 12pt; font-weight: bold; }
      .detail { font-size: 7pt; color: #666; }
      .items { margin: 4px 0; }
      .item { display: flex; justify-content: space-between; padding: 2px 0; }
      .item-name { flex: 1; word-break: break-word; padding-right: 2px; font-size: 8pt; }
      .item-qty { width: 20px; text-align: center; flex-shrink: 0; font-size: 8pt; }
      .item-price { width: 46px; text-align: right; font-weight: bold; flex-shrink: 0; font-size: 8pt; }
      .addon { font-size: 7pt; color: #666; padding-left: 4px; }
      .totals { border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }
      .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 8pt; }
      .grand-total { font-size: 11pt; font-weight: bold; border-top: 2px solid #000; margin-top: 3px; padding-top: 3px; }
      .split-section { border: 1px dashed #000; padding: 3px; margin: 4px 0; text-align: center; font-size: 8pt; }
      .footer { text-align: center; margin-top: 6px; }
      .footer .thanks { font-size: 9pt; font-weight: bold; margin-bottom: 3px; }
      .footer p { font-size: 7pt; color: #666; }
      @media print { @page { size: 58mm auto; margin: 0mm; } html, body { width: 58mm !important; margin: 0mm !important; } }
    </style></head><body>
      <div class="header">
        <h1>THE CURRY HOUSE</h1>
        <p>YOKOSUKA / ザ・カリーハウス横須賀</p>
        <p>Tel: 046-813-5869</p>
      </div>
      <div class="divider"></div>
      <div class="info">
        ${tableNum ? `<div class="table-num">TABLE ${tableNum}</div>` : ''}
        ${isDelivery ? `<div class="table-num">DELIVERY</div>` : ''}
        ${customerName ? `<div class="detail">Customer: ${customerName}</div>` : ''}
        ${partySize ? `<div class="detail">Party: ${partySize} guests</div>` : ''}
        <div class="detail">${new Date(createdAt).toLocaleString('ja-JP')}</div>
        <div class="detail">Order #${orderId.slice(0, 8).toUpperCase()}</div>
      </div>
      <div class="divider"></div>
      <div class="items">
        <div class="item" style="font-weight:bold;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:3px;">
          <span class="item-name">ITEM</span>
          <span class="item-qty">QTY</span>
          <span class="item-price">PRICE</span>
        </div>
        ${items.map((item) => `
          <div class="item">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">x${item.quantity}</span>
            <span class="item-price">${formatPrice((item.price || 0) * (item.quantity || 1))}</span>
          </div>
          ${item.addOns?.map((a) => `
            <div class="item addon">
              <span class="item-name">+ ${a.name}</span>
              <span class="item-qty"></span>
              <span class="item-price">${formatPrice(a.price || 0)}</span>
            </div>
          `).join('') || ''}
        `).join('')}
      </div>
      <div class="totals">
        <div class="total-row">
          <span>Subtotal / 小計</span>
          <span>${formatPrice(total)}</span>
        </div>
        <div class="total-row" style="font-size:10px;color:#666;">
          <span>Tax Included / 消費税込</span>
          <span></span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL / 合計</span>
          <span>${formatPrice(total)}</span>
        </div>
      </div>
      ${splitInfo}
      ${isDelivery && delivery?.payment_method ? `
        <div style="text-align:center;margin:4px 0;padding:3px;border:1px solid #ccc;font-size:8pt;">
          Payment: ${delivery.payment_method.toUpperCase()}
          ${delivery.payment_status ? ` (${delivery.payment_status})` : ''}
        </div>
      ` : ''}
      <div class="footer">
        <div class="thanks">Thank You! / ありがとう!</div>
        <p>Please visit us again!</p>
        <p>またのお越しをお待ちしております</p>
        <p style="margin-top:6px;">──────────────</p>
      </div>
    </body></html>
  `)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.document.title = ''
    printWindow.focus()
    printWindow.print()
    printWindow.onafterprint = () => printWindow.close()
  }
}

// ── Main Component ───────────────────────────────────────
export default function ReceptionPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [tables, setTables] = useState<TableSummary[]>([])
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'tables' | 'delivery'>('tables')

  // Auth guard — allow admin OR reception
  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'reception'].includes(user.role || ''))) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!supabase) return
    try {
      const [{ data: tableOrdersData }, { data: onlineOrdersData }] = await Promise.all([
        supabase
          .from('table_orders')
          .select('*')
          .in('status', ['pending', 'preparing', 'completed'])
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*')
          .in('status', ['pending', 'preparing', 'out_for_delivery'])
          .order('created_at', { ascending: false }),
      ])

      // Build table summaries
      const byTable: Record<number, TableOrder[]> = {}
      for (let i = 1; i <= TOTAL_TABLES; i++) byTable[i] = []
      ;(tableOrdersData || []).forEach((o: TableOrder) => {
        if (o.table_number >= 1 && o.table_number <= TOTAL_TABLES) {
          byTable[o.table_number].push(o)
        }
      })

      const summaries: TableSummary[] = []
      for (let i = 1; i <= TOTAL_TABLES; i++) {
        const orders = byTable[i]
        const isOccupied = orders.length > 0
        const totalAmount = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
        const latest = orders[0] || null
        summaries.push({
          tableNumber: i,
          isOccupied,
          orders,
          totalAmount,
          customerName: latest?.customer_name || '',
          partySize: latest?.party_size || 0,
          latestOrderTime: latest?.created_at || null,
        })
      }
      setTables(summaries)

      // Delivery/pickup orders
      setDeliveryOrders((onlineOrdersData || []) as DeliveryOrder[])
    } catch (err) {
      console.error('Reception fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000) // refresh every 15s
    return () => clearInterval(interval)
  }, [fetchData])

  const isAuthed = user && ['admin', 'reception'].includes(user.role || '')
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4" />
          <p className="text-orange-400 font-semibold">Loading Reception...</p>
        </div>
      </div>
    )
  }
  if (!isAuthed) return null

  const occupiedTables = tables.filter(t => t.isOccupied)
  const totalRevenue = occupiedTables.reduce((s, t) => s + t.totalAmount, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">Reception Desk</h1>
              <p className="text-orange-100 text-sm">The Curry House Yokosuka</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-lg font-mono font-bold">{currentTime.toLocaleTimeString('ja-JP')}</p>
                <p className="text-orange-100 text-xs">{currentTime.toLocaleDateString('ja-JP')}</p>
              </div>
              <button
                onClick={fetchData}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{occupiedTables.length}</p>
              <p className="text-orange-100 text-xs">Tables Occupied</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{deliveryOrders.length}</p>
              <p className="text-orange-100 text-xs">Active Deliveries</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{formatPrice(totalRevenue)}</p>
              <p className="text-orange-100 text-xs">Table Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'tables'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <UtensilsCrossed size={16} />
            Tables ({occupiedTables.length}/{TOTAL_TABLES})
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'delivery'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Printer size={16} />
            Delivery / Pickup
            {deliveryOrders.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {deliveryOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tables View ── */}
        {activeTab === 'tables' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pb-8">
            {tables.map((table) => (
              <div
                key={table.tableNumber}
                className={`rounded-xl border-2 p-3 flex flex-col gap-2 transition-all ${
                  table.isOccupied
                    ? 'bg-gray-800 border-orange-500 shadow-orange-900/50 shadow-lg'
                    : 'bg-gray-900 border-gray-700 opacity-50'
                }`}
              >
                {/* Table number */}
                <div className="text-center">
                  <span className={`text-2xl font-black ${table.isOccupied ? 'text-orange-400' : 'text-gray-600'}`}>
                    {table.tableNumber}
                  </span>
                  {table.isOccupied && (
                    <div className="mt-0.5">
                      <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                        OCCUPIED
                      </span>
                    </div>
                  )}
                </div>

                {/* Table info */}
                {table.isOccupied && (
                  <>
                    {table.customerName && (
                      <p className="text-xs text-gray-300 text-center truncate">{table.customerName}</p>
                    )}
                    {table.partySize > 0 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Users size={11} />
                        <span>{table.partySize}</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{formatPrice(table.totalAmount)}</p>
                    </div>
                    {table.latestOrderTime && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <Clock size={10} />
                        <span>{new Date(table.latestOrderTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {/* Print Bill Button */}
                    <button
                      onClick={() => printBill(table, null)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-lg text-white text-xs font-bold transition-all"
                    >
                      <Printer size={13} />
                      Print Bill
                    </button>
                  </>
                )}

                {!table.isOccupied && (
                  <p className="text-xs text-gray-600 text-center">Empty</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Delivery / Online Orders View ── */}
        {activeTab === 'delivery' && (
          <div className="space-y-3 pb-8">
            {deliveryOrders.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Printer size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">No active delivery orders</p>
              </div>
            )}
            {deliveryOrders.map((order) => (
              <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        order.order_type === 'delivery'
                          ? 'bg-blue-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}>
                        {order.order_type === 'delivery' ? 'DELIVERY' : 'PICKUP'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        order.status === 'pending' ? 'bg-yellow-500 text-black'
                        : order.status === 'preparing' ? 'bg-blue-500 text-white'
                        : 'bg-purple-500 text-white'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-bold text-white text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_phone}</p>
                    {order.delivery_address && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{order.delivery_address}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
                      {new Date(order.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {/* Items preview */}
                    <div className="mt-2 space-y-0.5">
                      {order.items.slice(0, 3).map((item, i) => (
                        <p key={i} className="text-xs text-gray-300">
                          × {item.quantity} {item.name}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-gray-500">+{order.items.length - 3} more...</p>
                      )}
                    </div>
                  </div>

                  {/* Right side: total + print */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-lg font-black text-orange-400">{formatPrice(order.total_amount)}</p>
                    <p className="text-xs text-gray-500">#{order.id.slice(0, 6).toUpperCase()}</p>
                    <button
                      onClick={() => printBill(null, order)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-lg text-white text-sm font-bold transition-all"
                    >
                      <Printer size={14} />
                      Print Bill
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

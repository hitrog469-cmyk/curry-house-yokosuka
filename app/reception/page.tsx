'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { playNewOrderSound, playBillRequestSound, playDeliveryAlertSound, enableAudio } from '@/lib/notification-sound'

interface OrderItem {
  name: string
  quantity: number
  price: number
  spiceLevel?: string
  addOns?: { name: string; price: number }[]
  variation?: string
  setMealChoices?: { curries: string[]; naan: string; rice: string }
}

interface Order {
  id: string
  table_number?: number
  customer_name: string
  customer_phone?: string
  delivery_address?: string
  items: OrderItem[]
  total_amount: number
  status: string
  order_type?: string
  party_size?: number
  split_bill?: boolean
  number_of_splits?: number
  notes?: string
  payment_status?: string
  created_at: string
  updated_at?: string
}

interface TableOrder {
  id: string
  table_number: number
  customer_name?: string
  party_size?: number
  items: OrderItem[]
  total_amount: number
  status: string
  created_at: string
  notes?: string
}

type TabType = 'all' | 'table' | 'delivery'

export default function ReceptionDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const previousOrderCountRef = useRef(0)

  const supabase = getSupabaseBrowserClient()

  // Enable audio on first click
  const handleEnableAudio = useCallback(async () => {
    if (!audioEnabled) {
      const success = await enableAudio()
      if (success) {
        setAudioEnabled(true)
      }
    }
  }, [audioEnabled])

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    if (!supabase) return
    try {
      const [ordersResult, tableOrdersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('table_orders')
          .select('*')
          .in('status', ['pending', 'preparing', 'completed'])
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      if (ordersResult.data) setOrders(ordersResult.data)
      if (tableOrdersResult.data) setTableOrders(tableOrdersResult.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Mark order as confirmed (preparing)
  const confirmOrder = async (orderId: string, table: 'orders' | 'table_orders') => {
    if (!supabase) return
    await supabase.from(table).update({ status: 'preparing' }).eq('id', orderId)
    setNewOrderIds(prev => { const n = new Set(prev); n.delete(orderId); return n })
    fetchOrders()
  }

  // Mark order as completed
  const completeOrder = async (orderId: string, table: 'orders' | 'table_orders') => {
    if (!supabase) return
    await supabase.from(table).update({ status: 'completed' }).eq('id', orderId)
    fetchOrders()
  }

  // Update delivery status
  const updateDeliveryStatus = async (orderId: string, status: string) => {
    if (!supabase) return
    await supabase.from('orders').update({ status }).eq('id', orderId)
    fetchOrders()
  }

  // Real-time subscriptions
  useEffect(() => {
    fetchOrders()

    if (!supabase) return

    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('reception_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' && audioEnabled) {
          playNewOrderSound(1.0)
          const newOrder = payload.new as Order
          setNewOrderIds(prev => new Set(prev).add(newOrder.id))
        }
        fetchOrders()
      })
      .subscribe()

    // Subscribe to table orders
    const tableChannel = supabase
      .channel('reception_table_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_orders' }, (payload) => {
        if (payload.eventType === 'INSERT' && audioEnabled) {
          playNewOrderSound(1.0)
          const newOrder = payload.new as TableOrder
          setNewOrderIds(prev => new Set(prev).add(newOrder.id))
        }
        fetchOrders()
      })
      .subscribe()

    // Subscribe to notifications for bill requests etc
    const notifChannel = supabase
      .channel('reception_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'target_role=eq.reception'
      }, (payload) => {
        const notif = payload.new as any
        if (notif.sound_type === 'billRequest' && audioEnabled) {
          playBillRequestSound(0.8)
        } else if (notif.sound_type === 'deliveryAlert' && audioEnabled) {
          playDeliveryAlertSound(0.8)
        } else if (audioEnabled) {
          playNewOrderSound(1.0)
        }
      })
      .subscribe()

    // Update clock
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)

    return () => {
      supabase?.removeChannel(ordersChannel)
      supabase?.removeChannel(tableChannel)
      supabase?.removeChannel(notifChannel)
      clearInterval(timeInterval)
    }
  }, [fetchOrders, audioEnabled, supabase])

  // Handle Enter key to confirm selected order
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedOrder) {
        // Find if it's in orders or table_orders
        const order = orders.find(o => o.id === selectedOrder)
        const tOrder = tableOrders.find(o => o.id === selectedOrder)

        if (order && order.status === 'pending') {
          confirmOrder(order.id, 'orders')
        } else if (tOrder && tOrder.status === 'pending') {
          confirmOrder(tOrder.id, 'table_orders')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedOrder, orders, tableOrders])

  // Combined & filtered order list
  const allPendingOrders = [
    ...orders.filter(o => o.status === 'pending').map(o => ({ ...o, source: 'orders' as const })),
    ...tableOrders.filter(o => o.status === 'pending').map(o => ({
      ...o,
      source: 'table_orders' as const,
      order_type: 'in-house',
      customer_name: o.customer_name || 'Table Guest',
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const allActiveOrders = [
    ...orders.filter(o => ['preparing', 'out_for_delivery'].includes(o.status)).map(o => ({ ...o, source: 'orders' as const })),
    ...tableOrders.filter(o => o.status === 'preparing').map(o => ({
      ...o,
      source: 'table_orders' as const,
      order_type: 'in-house',
      customer_name: o.customer_name || 'Table Guest',
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredPending = activeTab === 'all' ? allPendingOrders
    : activeTab === 'table' ? allPendingOrders.filter(o => o.order_type === 'in-house')
    : allPendingOrders.filter(o => o.order_type !== 'in-house')

  const filteredActive = activeTab === 'all' ? allActiveOrders
    : activeTab === 'table' ? allActiveOrders.filter(o => o.order_type === 'in-house')
    : allActiveOrders.filter(o => o.order_type !== 'in-house')

  const stats = {
    pendingCount: allPendingOrders.length,
    activeCount: allActiveOrders.length,
    tableOrders: tableOrders.filter(o => ['pending', 'preparing'].includes(o.status)).length,
    deliveryOrders: orders.filter(o => o.order_type === 'delivery' && ['pending', 'preparing', 'out_for_delivery'].includes(o.status)).length,
    todayRevenue: [...orders, ...tableOrders]
      .filter(o => {
        const d = new Date(o.created_at)
        const today = new Date()
        return d.toDateString() === today.toDateString() && o.status !== 'cancelled'
      })
      .reduce((sum, o) => sum + o.total_amount, 0),
  }

  const getTimeSince = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <div className="text-white text-2xl font-bold">Loading Reception...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white select-none" onClick={handleEnableAudio}>
      {/* Audio enable banner */}
      {!audioEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 cursor-pointer animate-pulse"
          onClick={handleEnableAudio}
        >
          <span className="text-lg font-bold">Click anywhere to enable order alert sounds</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 border-b-4 border-orange-500 py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">RECEPTION DESK</h1>
              <p className="text-gray-500 text-xs">The Curry House Yokosuka</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${audioEnabled ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}>
              {audioEnabled ? 'SOUND ON' : 'SOUND OFF'}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="flex gap-3">
              {stats.pendingCount > 0 && (
                <div className="bg-red-600 px-4 py-2 rounded-lg animate-pulse">
                  <span className="text-2xl font-black">{stats.pendingCount}</span>
                  <span className="text-xs ml-1">PENDING</span>
                </div>
              )}
              <div className="bg-blue-600 px-4 py-2 rounded-lg">
                <span className="text-2xl font-black">{stats.activeCount}</span>
                <span className="text-xs ml-1">ACTIVE</span>
              </div>
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-lg font-bold text-green-400">{formatPrice(stats.todayRevenue)}</span>
                <span className="text-xs ml-1 text-gray-400">TODAY</span>
              </div>
            </div>

            {/* Clock */}
            <div className="text-right">
              <div className="text-3xl font-black text-orange-500 tabular-nums">
                {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-xs text-gray-500">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab filters */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-2">
        <div className="flex gap-2">
          {([
            { key: 'all' as TabType, label: 'All Orders', count: stats.pendingCount + stats.activeCount },
            { key: 'table' as TabType, label: 'Table Orders', count: stats.tableOrders },
            { key: 'delivery' as TabType, label: 'Delivery', count: stats.deliveryOrders },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}

          <div className="ml-auto text-xs text-gray-500 flex items-center">
            Press <kbd className="mx-1 px-2 py-1 bg-gray-800 rounded text-orange-400 font-mono">ENTER</kbd> to confirm selected order
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left: Order list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Pending orders */}
          {filteredPending.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                NEW ORDERS ({filteredPending.length})
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filteredPending.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`text-left w-full p-4 rounded-xl border-2 transition-all ${
                      newOrderIds.has(order.id)
                        ? 'border-red-500 bg-red-950/50 animate-pulse'
                        : selectedOrder === order.id
                        ? 'border-orange-500 bg-orange-950/30'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {order.order_type === 'in-house' ? (
                          <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                            TABLE {order.table_number}
                          </span>
                        ) : (
                          <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                            DELIVERY
                          </span>
                        )}
                        <span className="font-bold">{order.customer_name}</span>
                      </div>
                      <span className="text-orange-400 text-xs font-mono">{getTimeSince(order.created_at)}</span>
                    </div>

                    <div className="text-sm text-gray-400 space-y-0.5">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-gray-600 text-xs">+{order.items.length - 3} more items</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
                      <span className="text-xl font-black text-green-400">{formatPrice(order.total_amount)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          confirmOrder(order.id, order.source)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Confirm
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active orders */}
          {filteredActive.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                ACTIVE ORDERS ({filteredActive.length})
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filteredActive.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`text-left w-full p-4 rounded-xl border-2 transition-all ${
                      selectedOrder === order.id
                        ? 'border-blue-500 bg-blue-950/30'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {order.order_type === 'in-house' ? (
                          <span className="bg-purple-600/60 text-white px-2 py-0.5 rounded text-xs font-bold">
                            TABLE {order.table_number}
                          </span>
                        ) : (
                          <span className="bg-green-600/60 text-white px-2 py-0.5 rounded text-xs font-bold">
                            DELIVERY
                          </span>
                        )}
                        <span className="font-bold">{order.customer_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          order.status === 'preparing' ? 'bg-blue-600' : 'bg-yellow-600'
                        }`}>
                          {order.status === 'preparing' ? 'PREPARING' : 'OUT FOR DELIVERY'}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs font-mono">{getTimeSince(order.created_at)}</span>
                    </div>

                    <div className="text-sm text-gray-400">
                      {order.items.slice(0, 2).map((item, i) => (
                        <span key={i}>{item.name} x{item.quantity}{i < Math.min(order.items.length, 2) - 1 ? ', ' : ''}</span>
                      ))}
                      {order.items.length > 2 && <span className="text-gray-600"> +{order.items.length - 2}</span>}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                      <span className="font-bold text-green-400">{formatPrice(order.total_amount)}</span>
                      <div className="flex gap-2">
                        {order.source === 'orders' && order.status === 'preparing' && order.order_type !== 'in-house' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order.id, 'out_for_delivery') }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            Out for Delivery
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); completeOrder(order.id, order.source) }}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPending.length === 0 && filteredActive.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-4">--</div>
                <p className="text-xl font-bold">No active orders</p>
                <p className="text-sm mt-2">New orders will appear here with a sound alert</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order detail panel */}
        <div className="w-[400px] bg-gray-900 border-l border-gray-800 overflow-y-auto">
          {(() => {
            const order = [...orders, ...tableOrders.map(o => ({
              ...o,
              order_type: 'in-house',
              customer_name: o.customer_name || 'Table Guest',
              customer_phone: '',
              delivery_address: '',
              notes: o.notes || '',
              payment_status: 'pending',
            }))].find(o => o.id === selectedOrder)

            if (!order) return (
              <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center p-8">
                  <div className="text-5xl mb-4">--</div>
                  <p className="font-bold">Select an order</p>
                  <p className="text-sm mt-1">Click any order to see details</p>
                </div>
              </div>
            )

            return (
              <div className="p-5">
                {/* Order header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {order.order_type === 'in-house' ? (
                      <div className="text-3xl font-black text-purple-400">TABLE {order.table_number}</div>
                    ) : (
                      <div className="text-xl font-black text-green-400">DELIVERY</div>
                    )}
                    <div className="text-lg font-bold">{order.customer_name}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'pending' ? 'bg-red-600 animate-pulse'
                    : order.status === 'preparing' ? 'bg-blue-600'
                    : order.status === 'out_for_delivery' ? 'bg-yellow-600'
                    : order.status === 'completed' ? 'bg-green-600'
                    : 'bg-gray-600'
                  }`}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </div>
                </div>

                {/* Customer info */}
                <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm space-y-1">
                  {order.customer_phone && <div className="text-gray-400">Tel: {order.customer_phone}</div>}
                  {order.delivery_address && <div className="text-gray-400">Addr: {order.delivery_address}</div>}
                  {order.party_size && <div className="text-gray-400">{order.party_size} guests</div>}
                  <div className="text-gray-500 text-xs">
                    {new Date(order.created_at).toLocaleString('ja-JP')} ({getTimeSince(order.created_at)} ago)
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-500 mb-2">ORDER ITEMS</h3>
                  <div className="space-y-2">
                    {order.items.map((item: OrderItem, i: number) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-bold">{item.name}</div>
                            {item.spiceLevel && (
                              <div className="text-xs text-orange-400 mt-0.5">Spice: {item.spiceLevel}</div>
                            )}
                            {item.addOns && item.addOns.length > 0 && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                + {item.addOns.map(a => a.name).join(', ')}
                              </div>
                            )}
                            {item.variation && (
                              <div className="text-xs text-gray-400">Size: {item.variation}</div>
                            )}
                            {item.setMealChoices && (
                              <div className="text-xs text-blue-400 mt-1">
                                <div>Curries: {item.setMealChoices.curries.join(', ')}</div>
                                <div>Naan: {item.setMealChoices.naan} | Rice: {item.setMealChoices.rice}</div>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-3">
                            <div className="text-lg font-black">x{item.quantity}</div>
                            <div className="text-sm text-green-400">{formatPrice(item.price * item.quantity)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-4">
                    <div className="text-xs font-bold text-yellow-500 mb-1">NOTE</div>
                    <div className="text-sm text-yellow-200">{order.notes}</div>
                  </div>
                )}

                {/* Total */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total</span>
                    <span className="text-3xl font-black text-green-400">{formatPrice(order.total_amount)}</span>
                  </div>
                  {order.payment_status && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-500 text-xs">Payment</span>
                      <span className={`text-xs font-bold ${
                        order.payment_status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {order.payment_status === 'completed' ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => {
                        const tbl = tableOrders.find(o => o.id === order.id) ? 'table_orders' : 'orders'
                        confirmOrder(order.id, tbl)
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'preparing' && order.order_type !== 'in-house' && (
                    <button
                      onClick={() => updateDeliveryStatus(order.id, 'out_for_delivery')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Send Out for Delivery
                    </button>
                  )}
                  {['preparing', 'out_for_delivery'].includes(order.status) && (
                    <button
                      onClick={() => {
                        const tbl = tableOrders.find(o => o.id === order.id) ? 'table_orders' : 'orders'
                        completeOrder(order.id, tbl)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

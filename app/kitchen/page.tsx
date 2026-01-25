'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatPrice } from '@/lib/utils'

interface OrderItem {
  item_id: string
  name: string
  quantity: number
  price: number
  subtotal: number
}

interface TableOrder {
  id: string
  table_number: number
  items: OrderItem[]
  total_amount: number
  status: string
  created_at: string
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Play notification sound for new orders
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .select('*')
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark order as preparing
  const markAsPreparing = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('table_orders')
        .update({ status: 'preparing' })
        .eq('id', orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  // Complete order
  const completeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('table_orders')
        .update({ status: 'completed' })
        .eq('id', orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error completing order:', error)
    }
  }

  // Print order (when Enter is pressed)
  const printOrder = (order: TableOrder) => {
    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table ${order.table_number} - Order</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 10px;
            font-size: 12px;
          }
          h1 {
            text-align: center;
            font-size: 18px;
            margin: 5px 0;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .table-info {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
          }
          .item {
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            width: 40px;
            text-align: center;
          }
          .footer {
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
            text-align: center;
          }
          .total {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>THE CURRY HOUSE YOKOSUKA</h1>
          <div>KITCHEN ORDER</div>
          <div>${new Date(order.created_at).toLocaleString('ja-JP')}</div>
        </div>

        <div class="table-info">
          TABLE ${order.table_number}
        </div>

        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">x${item.quantity}</div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <div class="total">TOTAL: ${formatPrice(order.total_amount)}</div>
          <div>Order ID: ${order.id.slice(0, 8)}</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedOrder) {
        const order = orders.find(o => o.id === selectedOrder)
        if (order) {
          printOrder(order)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedOrder, orders])

  // Real-time subscriptions
  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('table_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_orders'
        },
        (payload) => {
          console.log('Order change detected:', payload)
          playNotificationSound()
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Kitchen Display...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hidden audio for notifications */}
      <audio ref={audioRef} src="/notification.mp3" />

      {/* Header */}
      <div className="bg-gray-800 border-b-4 border-orange-500 py-4">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🍛 Kitchen Display</h1>
              <p className="text-gray-400">The Curry House Yokosuka</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-orange-500">{orders.length}</div>
              <div className="text-gray-400">Active Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/50 border-b border-blue-700 py-3">
        <div className="container-custom">
          <p className="text-center text-blue-200">
            📝 <strong>Click on an order</strong> to select it, then press <strong>ENTER</strong> to print
          </p>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* New Orders Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-red-600 px-3 py-1 rounded-lg">NEW</span>
            <span>Pending Orders ({pendingOrders.length})</span>
          </h2>
          {pendingOrders.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              No pending orders
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className={`bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border-4 ${
                    selectedOrder === order.id
                      ? 'border-yellow-500 shadow-2xl shadow-yellow-500/50'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-black text-yellow-500">
                      TABLE {order.table_number}
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('ja-JP')}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-700/50 rounded px-3 py-2">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-xl font-bold text-orange-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-2xl font-bold text-center mb-4 text-green-400">
                    {formatPrice(order.total_amount)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsPreparing(order.id)
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 font-bold py-3 rounded-lg transition-all"
                  >
                    Start Preparing →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preparing Orders Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-orange-600 px-3 py-1 rounded-lg">PREPARING</span>
            <span>In Progress ({preparingOrders.length})</span>
          </h2>
          {preparingOrders.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              No orders being prepared
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preparingOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className={`bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border-4 ${
                    selectedOrder === order.id
                      ? 'border-yellow-500 shadow-2xl shadow-yellow-500/50'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-black text-orange-500">
                      TABLE {order.table_number}
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('ja-JP')}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-700/50 rounded px-3 py-2">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-xl font-bold text-orange-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-2xl font-bold text-center mb-4 text-green-400">
                    {formatPrice(order.total_amount)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      completeOrder(order.id)
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 font-bold py-3 rounded-lg transition-all"
                  >
                    ✓ Mark Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

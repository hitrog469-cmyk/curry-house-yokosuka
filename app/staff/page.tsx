'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  total_amount: number
  status: string
  items: any[]
  created_at: string
  notes?: string
}

export default function StaffPortal() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'staff') {
      router.push('/login')
      return
    }

    setUser(parsedUser)
    fetchMyOrders(parsedUser.id)
  }, [])

  async function fetchMyOrders(staffId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_staff_id', staffId)
      .in('status', ['preparing', 'out_for_delivery'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error && user) {
      fetchMyOrders(user.id)
    }
  }

  function handleLogout() {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Delivery Portal</h1>
              <p className="text-lg opacity-90">👋 Welcome, {user.name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Preparing</h3>
            <p className="text-4xl font-bold text-blue-700">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Out for Delivery</h3>
            <p className="text-4xl font-bold text-purple-700">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </p>
          </div>
        </div>

        {/* Orders */}
        <h2 className="text-2xl font-bold mb-6">My Assigned Deliveries</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading deliveries...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg mb-2">No deliveries assigned</p>
            <p className="text-gray-500">Check back later for new orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card hover:shadow-xl transition-shadow">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl mb-2">{order.customer_name}</h3>
                        <p className="text-gray-600 mb-1">
                          <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                            📞 {order.customer_phone}
                          </a>
                        </p>
                        <p className="text-gray-700 font-medium">📍 {order.delivery_address}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ORDER ITEMS:</p>
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-sm mb-1">
                          • {item.name} x{item.quantity}
                        </p>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        💬 <strong>Customer Note:</strong> {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-green-700">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="btn-primary text-lg py-4"
                      >
                        🚗 Start Delivery
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
                      >
                        ✅ Mark Delivered
                      </button>
                    )}

                    <p className="text-xs text-gray-500 text-center">
                      Ordered: {new Date(order.created_at).toLocaleString()}
                    </p>
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
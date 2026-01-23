'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, ORDER_STATUS } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
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
  assigned_staff_id?: string
  notes?: string
}

type Staff = {
  id: string
  name: string
  phone: string
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Auth guard - only admin can access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/menu')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders()
      fetchStaff()
    }
  }, [selectedStatus, user])

  async function fetchOrders() {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus)
    }

    const { data, error } = await query

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  async function fetchStaff() {
    const { data } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('role', 'staff')
      .eq('is_active', true)

    if (data) {
      setStaff(data)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      fetchOrders()
    }
  }

  async function assignStaff(orderId: string, staffId: string) {
    const { error } = await supabase
      .from('orders')
      .update({ 
        assigned_staff_id: staffId,
        status: 'preparing' 
      })
      .eq('id', orderId)

    if (!error) {
      fetchOrders()
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      preparing: 'bg-blue-100 text-blue-800 border-blue-300',
      out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[status] || colors.pending
  }

  const getStatusDisplay = (status: string) => {
    const displays: any = {
      pending: '⏳ Pending',
      preparing: '👨‍🍳 Preparing',
      out_for_delivery: '🚗 Out for Delivery',
      delivered: '✅ Delivered',
      cancelled: '❌ Cancelled',
    }
    return displays[status] || status
  }

  const statsData = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-curry-dark to-gray-800 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">All Orders</h1>
              <p className="text-lg opacity-90">The Curry House Yokosuka - Admin Panel</p>
            </div>
            <Link href="/" className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-colors">
              🏠 Home
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending Orders</h3>
            <p className="text-4xl font-bold text-yellow-700">{statsData.pending}</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Preparing</h3>
            <p className="text-4xl font-bold text-blue-700">{statsData.preparing}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Out for Delivery</h3>
            <p className="text-4xl font-bold text-purple-700">{statsData.out_for_delivery}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-700">{formatPrice(statsData.totalRevenue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Filter Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'preparing', 'out_for_delivery', 'delivered'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  selectedStatus === status
                    ? 'bg-curry-primary text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '📋 All Orders' : getStatusDisplay(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-curry-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card hover:shadow-xl transition-shadow">
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Order Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{order.customer_name}</h3>
                        <p className="text-gray-600 text-sm">📞 {order.customer_phone}</p>
                        <p className="text-gray-600 text-sm mt-1">📍 {order.delivery_address}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {getStatusDisplay(order.status)}
                      </span>
                    </div>
                    
                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ORDER ITEMS:</p>
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-sm">
                          • {item.name} x{item.quantity} - {formatPrice(item.price * item.quantity)}
                        </p>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-600 italic">💬 Note: {order.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-2">UPDATE STATUS:</p>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="preparing">👨‍🍳 Preparing</option>
                      <option value="out_for_delivery">🚗 Out for Delivery</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>

                    <p className="text-sm font-semibold text-gray-500 mb-2">ASSIGN STAFF:</p>
                    <select
                      value={order.assigned_staff_id || ''}
                      onChange={(e) => assignStaff(order.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Not Assigned</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {s.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Total & Time */}
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">TOTAL AMOUNT</p>
                    <p className="text-3xl font-bold text-curry-accent mb-4">
                      {formatPrice(order.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
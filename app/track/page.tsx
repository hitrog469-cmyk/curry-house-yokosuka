'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

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

export default function TrackOrderPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSearched(true)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const getStatusProgress = (status: string) => {
    const progress: any = {
      pending: 25,
      preparing: 50,
      out_for_delivery: 75,
      delivered: 100,
      cancelled: 0
    }
    return progress[status] || 0
  }

  const getStatusIcon = (status: string) => {
    const icons: any = {
      pending: '⏳',
      preparing: '👨‍🍳',
      out_for_delivery: '🚗',
      delivered: '✅',
      cancelled: '❌'
    }
    return icons[status] || '⏳'
  }

  const getStatusText = (status: string) => {
    const texts: any = {
      pending: 'Order Received',
      preparing: 'Being Prepared',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return texts[status] || status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-curry-primary to-green-600 text-white py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-white hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Track Your Order</h1>
          <p className="text-lg opacity-90">Enter your phone number to see order status</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <div className="card mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-curry-primary focus:border-transparent"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-lg py-4 disabled:opacity-50"
              >
                {loading ? 'Searching...' : '🔍 Track Orders'}
              </button>
            </form>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-curry-primary border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Searching for orders...</p>
            </div>
          ) : searched && orders.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 text-lg mb-2">No orders found</p>
              <p className="text-gray-500">Please check your phone number and try again</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="card">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-xl mb-1">Order for {order.customer_name}</h3>
                      <p className="text-gray-500 text-sm">
                        Placed on {new Date(order.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-curry-accent">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-6">
                      <div className="relative">
                        {/* Progress Line */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-curry-primary to-green-600 transition-all duration-500"
                            style={{ width: `${getStatusProgress(order.status)}%` }}
                          />
                        </div>

                        {/* Status Steps */}
                        <div className="flex justify-between mt-4">
                          {['pending', 'preparing', 'out_for_delivery', 'delivered'].map((step) => (
                            <div key={step} className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl mb-2 ${
                                getStatusProgress(order.status) >= getStatusProgress(step)
                                  ? 'bg-curry-primary text-white scale-110'
                                  : 'bg-gray-200 text-gray-400'
                              } transition-all duration-300`}>
                                {getStatusIcon(step)}
                              </div>
                              <p className={`text-xs text-center font-medium ${
                                order.status === step ? 'text-curry-primary font-bold' : 'text-gray-500'
                              }`}>
                                {getStatusText(step)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancelled Status */}
                  {order.status === 'cancelled' && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                      <p className="text-red-700 font-semibold">❌ This order has been cancelled</p>
                    </div>
                  )}

                  {/* Current Status */}
                  <div className="bg-gradient-to-r from-curry-primary to-green-600 text-white rounded-lg p-4 mb-6">
                    <p className="text-sm opacity-90 mb-1">Current Status</p>
                    <p className="text-2xl font-bold">
                      {getStatusIcon(order.status)} {getStatusText(order.status)}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-semibold mb-3">Order Items:</p>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between mb-2">
                        <span className="text-gray-700">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Delivery Address:</p>
                    <p className="text-gray-700">📍 {order.delivery_address}</p>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                      <p className="text-sm"><strong>Your Note:</strong> {order.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
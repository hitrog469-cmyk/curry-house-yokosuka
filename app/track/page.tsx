'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const supabase = getSupabaseBrowserClient()
import { formatPrice } from '@/lib/utils'
import { RESTAURANT_LOCATION } from '@/lib/delivery-fee'
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

type DriverLocation = {
  latitude: number
  longitude: number
  updated_at: string
}

// 5-minute cancellation window in milliseconds
const CANCELLATION_WINDOW_MS = 5 * 60 * 1000

export default function TrackOrderPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())
  // Driver locations keyed by order ID
  const [driverLocations, setDriverLocations] = useState<Map<string, DriverLocation>>(new Map())
  const channelRef = useRef<any>(null)

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Subscribe to delivery location updates when we have out_for_delivery orders
  useEffect(() => {
    if (!supabase) return

    const activeOrderIds = orders
      .filter(o => o.status === 'out_for_delivery')
      .map(o => o.id)

    if (activeOrderIds.length === 0) {
      // No active deliveries, cleanup
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    // Fetch initial locations for all active orders
    async function fetchInitialLocations() {
      if (!supabase) return
      const { data } = await supabase
        .from('delivery_locations')
        .select('order_id, latitude, longitude, updated_at')
        .in('order_id', activeOrderIds)

      if (data) {
        setDriverLocations(prev => {
          const next = new Map(prev)
          data.forEach((loc: any) => {
            next.set(loc.order_id, {
              latitude: loc.latitude,
              longitude: loc.longitude,
              updated_at: loc.updated_at,
            })
          })
          return next
        })
      }
    }

    fetchInitialLocations()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('delivery_tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_locations',
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE') {
            setDriverLocations(prev => {
              const next = new Map(prev)
              next.delete(payload.old.order_id)
              return next
            })
          } else {
            const record = payload.new
            if (activeOrderIds.includes(record.order_id)) {
              setDriverLocations(prev => {
                const next = new Map(prev)
                next.set(record.order_id, {
                  latitude: record.latitude,
                  longitude: record.longitude,
                  updated_at: record.updated_at,
                })
                return next
              })
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [orders])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) { setLoading(false); return }
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

  // Check if order can be cancelled (within 5 minutes of creation)
  const canCancelOrder = (order: Order) => {
    if (order.status !== 'pending') return false
    const orderTime = new Date(order.created_at).getTime()
    const timeSinceOrder = currentTime - orderTime
    return timeSinceOrder < CANCELLATION_WINDOW_MS
  }

  // Get remaining time for cancellation
  const getCancellationTimeRemaining = (order: Order) => {
    const orderTime = new Date(order.created_at).getTime()
    const timeRemaining = CANCELLATION_WINDOW_MS - (currentTime - orderTime)
    if (timeRemaining <= 0) return null

    const minutes = Math.floor(timeRemaining / 60000)
    const seconds = Math.floor((timeRemaining % 60000) / 1000)
    return { minutes, seconds, total: timeRemaining }
  }

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    if (!supabase) return
    setCancellingId(orderId)

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      alert('Failed to cancel order. Please try again or contact support.')
      console.error(error)
    } else {
      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      ))
    }

    setCancellingId(null)
    setShowCancelConfirm(null)
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
      pending: '1',
      preparing: '2',
      out_for_delivery: '3',
      delivered: '4',
      cancelled: '—'
    }
    return icons[status] || '1'
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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-white/80 hover:text-white mb-4 inline-flex items-center gap-2 font-medium transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black mb-2">Track Your Order</h1>
          <p className="text-lg text-emerald-100">Enter your phone number to see order status</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-stone-50 focus:bg-white transition-all"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Track Orders'}
              </button>
            </form>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
              <p className="mt-4 text-stone-500">Searching for orders...</p>
            </div>
          ) : searched && orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
              <p className="text-stone-600 text-lg mb-2">No orders found</p>
              <p className="text-stone-400">Please check your phone number and try again</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const timeRemaining = getCancellationTimeRemaining(order)
                const canCancel = canCancelOrder(order)

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    {/* Order Header */}
                    <div className="p-5 border-b border-stone-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-xl text-stone-800 mb-1">Order for {order.customer_name}</h3>
                          <p className="text-stone-400 text-sm">
                            Placed on {new Date(order.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">
                            {formatPrice(order.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Cancellation Notice - Only for pending orders within 5 minutes */}
                      {order.status === 'pending' && timeRemaining && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-amber-800 text-sm">Need to cancel?</p>
                              <p className="text-amber-600 text-xs mt-0.5">
                                You have {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} remaining
                              </p>
                            </div>
                            <button
                              onClick={() => setShowCancelConfirm(order.id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                              Cancel Order
                            </button>
                          </div>
                          {/* Progress bar for cancellation window */}
                          <div className="mt-3 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 transition-all duration-1000"
                              style={{ width: `${(timeRemaining.total / CANCELLATION_WINDOW_MS) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Window expired notice */}
                      {order.status === 'pending' && !timeRemaining && (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-5">
                          <p className="text-stone-500 text-sm text-center">
                            Cancellation window has expired. Please call us if you need assistance.
                          </p>
                        </div>
                      )}

                      {/* Progress Bar - Only for non-cancelled orders */}
                      {order.status !== 'cancelled' && (
                        <div className="mb-6">
                          <div className="relative">
                            {/* Progress Line */}
                            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                style={{ width: `${getStatusProgress(order.status)}%` }}
                              />
                            </div>

                            {/* Status Steps */}
                            <div className="flex justify-between mt-4">
                              {['pending', 'preparing', 'out_for_delivery', 'delivered'].map((step) => (
                                <div key={step} className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 transition-all duration-300 ${
                                    getStatusProgress(order.status) >= getStatusProgress(step)
                                      ? 'bg-emerald-500 text-white scale-110 shadow-md'
                                      : 'bg-stone-200 text-stone-400'
                                  }`}>
                                    {getStatusIcon(step)}
                                  </div>
                                  <p className={`text-xs text-center font-medium ${
                                    order.status === step ? 'text-emerald-600 font-bold' : 'text-stone-400'
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
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-r-xl">
                          <p className="text-red-700 font-bold">This order has been cancelled</p>
                          <p className="text-red-600 text-sm mt-1">If you paid, a refund will be processed within 3-5 business days.</p>
                        </div>
                      )}

                      {/* Current Status */}
                      {order.status !== 'cancelled' && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 mb-5">
                          <p className="text-sm text-emerald-100 mb-1">Current Status</p>
                          <p className="text-2xl font-black">
                            {getStatusIcon(order.status)} {getStatusText(order.status)}
                          </p>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="bg-stone-50 rounded-xl p-4 mb-4">
                        <p className="font-bold text-stone-700 mb-3">Order Items:</p>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between mb-2 text-sm">
                            <span className="text-stone-600">
                              {item.name} x{item.quantity}
                              {item.spiceLevel && (
                                <span className="text-orange-500 ml-1">({item.spiceLevel})</span>
                              )}
                            </span>
                            <span className="font-bold text-stone-800">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      <div className="border-t border-stone-100 pt-4">
                        <p className="text-sm font-bold text-stone-500 mb-1">Delivery Address:</p>
                        <p className="text-stone-700">{order.delivery_address}</p>
                      </div>

                      {/* Delivery Map - Show for active orders */}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (() => {
                        const driverLoc = driverLocations.get(order.id)
                        const isOutForDelivery = order.status === 'out_for_delivery'
                        const hasDriverLocation = isOutForDelivery && driverLoc

                        return (
                          <div className="mt-4 rounded-xl overflow-hidden border border-stone-200">
                            <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between">
                              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                                {hasDriverLocation ? 'Live Driver Location' : isOutForDelivery ? 'Your order is on the way' : 'Restaurant Location'}
                              </p>
                              {hasDriverLocation && (
                                <div className="flex items-center gap-1.5">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  <span className="text-xs text-emerald-600 font-medium">Live</span>
                                </div>
                              )}
                            </div>
                            <div className="aspect-video">
                              {hasDriverLocation ? (
                                // Show driver location on map with marker
                                <iframe
                                  key={`${driverLoc.latitude}-${driverLoc.longitude}`}
                                  src={`https://www.google.com/maps?q=${driverLoc.latitude},${driverLoc.longitude}&z=15&output=embed`}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  className="w-full h-full"
                                ></iframe>
                              ) : (
                                // Show restaurant or delivery address
                                <iframe
                                  src={`https://www.google.com/maps?q=${encodeURIComponent(order.delivery_address || 'The Curry House Yokosuka')}&output=embed`}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  className="w-full h-full"
                                ></iframe>
                              )}
                            </div>
                            <div className="bg-stone-50 px-4 py-2 flex items-center justify-between">
                              <a
                                href={hasDriverLocation
                                  ? `https://www.google.com/maps?q=${driverLoc.latitude},${driverLoc.longitude}`
                                  : `https://www.google.com/maps/dir/${RESTAURANT_LOCATION.lat},${RESTAURANT_LOCATION.lng}/${encodeURIComponent(order.delivery_address)}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                              >
                                {hasDriverLocation ? 'Open driver location in Maps' : 'View directions in Google Maps'}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </a>
                              {hasDriverLocation && driverLoc.updated_at && (
                                <span className="text-xs text-stone-400">
                                  Updated {new Date(driverLoc.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Customer Notes */}
                      {order.notes && (
                        <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                          <p className="text-sm"><strong>Your Note:</strong> {order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-stone-200 p-6 text-center">
            <h3 className="font-bold text-stone-800 mb-2">Need Help?</h3>
            <p className="text-stone-500 text-sm mb-3">Contact us if you have any questions about your order</p>
            <a
              href="tel:046-876-8989"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Call: 046-876-8989
            </a>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-xl font-black text-stone-800 mb-2">Cancel Order?</h3>
              <p className="text-stone-500">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(showCancelConfirm)}
                disabled={cancellingId === showCancelConfirm}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {cancellingId === showCancelConfirm ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

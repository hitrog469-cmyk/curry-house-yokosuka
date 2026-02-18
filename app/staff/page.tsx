'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

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

// GPS update interval (60 seconds)
const LOCATION_UPDATE_INTERVAL_MS = 60 * 1000

export default function StaffPortal() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  // Track which orders have active GPS tracking
  const [trackingOrders, setTrackingOrders] = useState<Set<string>>(new Set())
  const [locationError, setLocationError] = useState<string | null>(null)
  // Refs for cleanup
  const watchIdsRef = useRef<Map<string, number>>(new Map())
  const intervalIdsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const latestPositionRef = useRef<Map<string, { lat: number; lng: number }>>(new Map())

  const supabase = getSupabaseBrowserClient()

  // Auth guard - allow staff and admin
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'staff' && user.role !== 'admin'))) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch orders assigned to this staff member
  useEffect(() => {
    if (user && (user.role === 'staff' || user.role === 'admin')) {
      fetchMyOrders(user.id)
    }
  }, [user])

  // Cleanup all GPS watchers on unmount
  useEffect(() => {
    return () => {
      watchIdsRef.current.forEach((watchId) => {
        navigator.geolocation.clearWatch(watchId)
      })
      intervalIdsRef.current.forEach((intervalId) => {
        clearInterval(intervalId)
      })
    }
  }, [])

  async function fetchMyOrders(staffId: string) {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_staff_id', staffId)
      .in('status', ['preparing', 'out_for_delivery'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
      // Auto-start tracking for any orders already out_for_delivery
      data.forEach((order) => {
        if (order.status === 'out_for_delivery' && !trackingOrders.has(order.id)) {
          startLocationTracking(order.id, staffId)
        }
      })
    }
    setLoading(false)
  }

  // Send location to Supabase
  const sendLocation = useCallback(async (orderId: string, staffId: string, lat: number, lng: number) => {
    if (!supabase) return
    const { error } = await supabase
      .from('delivery_locations')
      .upsert(
        {
          order_id: orderId,
          staff_id: staffId,
          latitude: lat,
          longitude: lng,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_id' }
      )

    if (error) {
      console.error('Failed to update location:', error)
    }
  }, [supabase])

  // Start GPS tracking for a specific order
  function startLocationTracking(orderId: string, staffId: string) {
    if (!('geolocation' in navigator)) {
      setLocationError('GPS not available on this device')
      return
    }

    setLocationError(null)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        latestPositionRef.current.set(orderId, { lat: latitude, lng: longitude })
      },
      (error) => {
        console.error('GPS error:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enable GPS.')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    )

    watchIdsRef.current.set(orderId, watchId)

    // Send initial location immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        latestPositionRef.current.set(orderId, { lat: latitude, lng: longitude })
        sendLocation(orderId, staffId, latitude, longitude)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )

    // Then send every 60 seconds
    const intervalId = setInterval(() => {
      const pos = latestPositionRef.current.get(orderId)
      if (pos) {
        sendLocation(orderId, staffId, pos.lat, pos.lng)
      }
    }, LOCATION_UPDATE_INTERVAL_MS)

    intervalIdsRef.current.set(orderId, intervalId)
    setTrackingOrders((prev) => new Set(prev).add(orderId))
  }

  // Stop GPS tracking for a specific order
  function stopLocationTracking(orderId: string) {
    const watchId = watchIdsRef.current.get(orderId)
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId)
      watchIdsRef.current.delete(orderId)
    }

    const intervalId = intervalIdsRef.current.get(orderId)
    if (intervalId) {
      clearInterval(intervalId)
      intervalIdsRef.current.delete(orderId)
    }

    latestPositionRef.current.delete(orderId)
    setTrackingOrders((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    if (!supabase || !user) return

    if (newStatus === 'out_for_delivery') {
      startLocationTracking(orderId, user.id)
    }

    if (newStatus === 'delivered') {
      stopLocationTracking(orderId)
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      fetchMyOrders(user.id)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) return null

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-56px)]">
      {/* Page Title Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Delivery Portal</h1>
              <p className="text-lg opacity-90">Welcome, {user.full_name || user.name || 'Staff'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/staff/dashboard" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-sm font-semibold">
                Counter
              </Link>
              <Link href="/" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-sm">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Location Error Banner */}
        {locationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <p className="text-sm font-medium">{locationError}</p>
          </div>
        )}

        {/* Active Tracking Banner */}
        {trackingOrders.size > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <p className="text-sm font-medium">
              Live tracking active for {trackingOrders.size} {trackingOrders.size === 1 ? 'delivery' : 'deliveries'} — location shared with customers every 60s
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Preparing</h3>
            <p className="text-4xl font-bold text-blue-700">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
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
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg mb-2">No deliveries assigned</p>
            <p className="text-gray-500 text-sm">Admin will assign orders to you from the dashboard</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl mb-2">{order.customer_name}</h3>
                        <p className="text-gray-600 mb-1">
                          📞{' '}
                          <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                            {order.customer_phone}
                          </a>
                        </p>
                        <p className="text-gray-700 font-medium">📍 {order.delivery_address}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'preparing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {order.status === 'preparing' ? '👨‍🍳 Preparing' : '🚗 On the way'}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ORDER ITEMS:</p>
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-sm mb-1">
                          • {item.name} ×{item.quantity}
                          {item.spiceLevel && <span className="text-orange-500 ml-1">🌶️{item.spiceLevel}</span>}
                        </p>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                        <strong>Customer Note:</strong> {order.notes}
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
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-4 rounded-xl transition-colors"
                      >
                        🚗 Start Delivery
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <>
                        {trackingOrders.has(order.id) && (
                          <div className="flex items-center gap-2 justify-center text-emerald-600 text-sm font-medium bg-emerald-50 py-2 rounded-lg">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live tracking active
                          </div>
                        )}
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
                        >
                          ✅ Mark Delivered
                        </button>
                      </>
                    )}

                    <p className="text-xs text-gray-500 text-center">
                      Ordered: {new Date(order.created_at).toLocaleString('ja-JP')}
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

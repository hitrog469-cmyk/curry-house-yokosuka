'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import {
  DollarSign, ClipboardList, TrendingUp, Users, UtensilsCrossed,
  ChevronRight, Clock, Truck, Store
} from 'lucide-react'
import KPICard from '@/components/ui/KPICard'
import CSSBarChart from '@/components/ui/CSSBarChart'

interface AnalyticsData {
  dailyRevenue: { label: string; value: number }[]
  hourlyVolume: { label: string; value: number }[]
  popularItems: { name: string; count: number; revenue: number }[]
  staffPerformance: { name: string; orders: number; revenue: number }[]
  todayRevenue: number
  todayOrders: number
  avgOrderValue: number
  deliveryCount: number
  dineInCount: number
  activeStaff: number
  revenueSparkData: number[]
}

export default function AdminAnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  const fetchAnalytics = useCallback(async () => {
    if (!supabase) return
    setLoading(true)

    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Fetch delivery orders (last 7 days)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status, items, assigned_staff_id, order_type')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Fetch table orders (last 7 days)
      const { data: tableOrders } = await supabase
        .from('table_orders')
        .select('total_amount, created_at, status, items, table_number')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Fetch active staff
      const { data: staffData } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'staff')
        .eq('is_active', true)

      const allOrders = recentOrders || []
      const allTableOrders = tableOrders || []
      const staffList = staffData || []

      // Compute daily revenue (last 7 days)
      const dailyMap = new Map<string, number>()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        dailyMap.set(key, 0)
      }

      const deliveredOrders = allOrders.filter(o => o.status === 'delivered')
      const completedTableOrders = allTableOrders.filter(o => o.status === 'completed')

      deliveredOrders.forEach(o => {
        const d = new Date(o.created_at)
        const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        if (dailyMap.has(key)) {
          dailyMap.set(key, (dailyMap.get(key) || 0) + o.total_amount)
        }
      })
      completedTableOrders.forEach(o => {
        const d = new Date(o.created_at)
        const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        if (dailyMap.has(key)) {
          dailyMap.set(key, (dailyMap.get(key) || 0) + o.total_amount)
        }
      })

      const dailyRevenue = Array.from(dailyMap.entries()).map(([label, value]) => ({
        label: label.split(',')[0] || label, // Just "Mon" or "Tue"
        value,
      }))

      const revenueSparkData = dailyRevenue.map(d => d.value)

      // Hourly volume
      const hourlyMap = new Map<number, number>()
      for (let h = 0; h < 24; h++) hourlyMap.set(h, 0)

      ;[...allOrders, ...allTableOrders].forEach(o => {
        const h = new Date(o.created_at).getHours()
        hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1)
      })

      // Only show hours 10-22 (restaurant hours)
      const hourlyVolume = Array.from(hourlyMap.entries())
        .filter(([h]) => h >= 10 && h <= 22)
        .map(([h, v]) => ({ label: `${h}:00`, value: v }))

      // Popular items
      const itemCountMap = new Map<string, { count: number; revenue: number }>()
      ;[...allOrders, ...allTableOrders].forEach(o => {
        if (!o.items) return
        o.items.forEach((item: any) => {
          const existing = itemCountMap.get(item.name) || { count: 0, revenue: 0 }
          existing.count += item.quantity || 1
          existing.revenue += (item.price || 0) * (item.quantity || 1)
          itemCountMap.set(item.name, existing)
        })
      })

      const popularItems = Array.from(itemCountMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Staff performance
      const staffMap = new Map<string, { orders: number; revenue: number }>()
      deliveredOrders.forEach(o => {
        if (!o.assigned_staff_id) return
        const existing = staffMap.get(o.assigned_staff_id) || { orders: 0, revenue: 0 }
        existing.orders += 1
        existing.revenue += o.total_amount
        staffMap.set(o.assigned_staff_id, existing)
      })

      const staffPerformance = Array.from(staffMap.entries())
        .map(([id, perf]) => {
          const staffMember = staffList.find(s => s.id === id)
          return { name: staffMember?.name || 'Unknown', ...perf }
        })
        .sort((a, b) => b.orders - a.orders)

      // Today's stats
      const todayDelivered = deliveredOrders.filter(o => new Date(o.created_at) >= todayStart)
      const todayTable = completedTableOrders.filter(o => new Date(o.created_at) >= todayStart)
      const todayRevenue = [...todayDelivered, ...todayTable].reduce((sum, o) => sum + o.total_amount, 0)
      const todayAllOrders = [...allOrders, ...allTableOrders].filter(o => new Date(o.created_at) >= todayStart)
      const todayOrders = todayAllOrders.length
      const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0

      const deliveryCount = allOrders.filter(o => o.order_type !== 'in-house').length
      const dineInCount = allTableOrders.length + allOrders.filter(o => o.order_type === 'in-house').length

      setData({
        dailyRevenue,
        hourlyVolume,
        popularItems,
        staffPerformance,
        todayRevenue,
        todayOrders,
        avgOrderValue,
        deliveryCount,
        dineInCount,
        activeStaff: staffList.length,
        revenueSparkData,
      })
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 text-lg">Unable to load analytics data</p>
      </div>
    )
  }

  const totalOrders7d = data.deliveryCount + data.dineInCount
  const deliveryPct = totalOrders7d > 0 ? Math.round((data.deliveryCount / totalOrders7d) * 100) : 0

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Today's Revenue"
          value={formatPrice(data.todayRevenue)}
          icon={DollarSign}
          color="border-green-500"
          iconBg="bg-green-500/20"
          iconColor="text-green-400"
          sparkData={data.revenueSparkData}
          href="/admin/analytics/revenue"
        />
        <KPICard
          title="Orders Today"
          value={data.todayOrders}
          icon={ClipboardList}
          color="border-blue-500"
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
          href="/admin/analytics/hourly"
        />
        <KPICard
          title="Avg Order Value"
          value={formatPrice(data.avgOrderValue)}
          icon={TrendingUp}
          color="border-purple-500"
          iconBg="bg-purple-500/20"
          iconColor="text-purple-400"
        />
        <KPICard
          title="Dine-in / Delivery"
          value={`${data.dineInCount} / ${data.deliveryCount}`}
          icon={UtensilsCrossed}
          color="border-orange-500"
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
        />
        <KPICard
          title="Active Staff"
          value={data.activeStaff}
          icon={Users}
          color="border-emerald-500"
          iconBg="bg-emerald-500/20"
          iconColor="text-emerald-400"
          href="/admin/analytics/staff"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/analytics/revenue" className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-green-600 transition-colors">
              Revenue Trend (7 Days)
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <CSSBarChart
            data={data.dailyRevenue}
            height={180}
            orientation="vertical"
            barColor="bg-green-500"
            formatValue={(v) => formatPrice(v)}
          />
        </div>

        {/* Orders by Hour */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/analytics/hourly" className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors">
              Orders by Hour (7 Days)
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <CSSBarChart
            data={data.hourlyVolume}
            orientation="horizontal"
            barColor="bg-blue-500"
          />
        </div>
      </div>

      {/* Popular Items + Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Link href="/admin/analytics/items" className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-orange-600 transition-colors mb-4">
            Top Menu Items
            <ChevronRight className="w-4 h-4" />
          </Link>
          {data.popularItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No item data available</p>
          ) : (
            <div className="space-y-3">
              {data.popularItems.map((item, i) => {
                const maxCount = data.popularItems[0]?.count || 1
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                          {item.count} orders &middot; {formatPrice(item.revenue)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-700"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Link href="/admin/analytics/staff" className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-emerald-600 transition-colors mb-4">
            Staff Performance
            <ChevronRight className="w-4 h-4" />
          </Link>
          {data.staffPerformance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No delivery data available</p>
          ) : (
            <div className="space-y-3">
              {data.staffPerformance.map((staff, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{staff.name}</p>
                      <p className="text-xs text-gray-500">{staff.orders} deliveries</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600">{formatPrice(staff.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Order Type Split */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Order Type Split (7 days)</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden flex">
                <div
                  className="bg-purple-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
                  style={{ width: `${100 - deliveryPct}%`, minWidth: data.dineInCount > 0 ? '30px' : '0' }}
                >
                  {100 - deliveryPct > 10 ? <><Store className="w-3 h-3 mr-1" />{100 - deliveryPct}%</> : ''}
                </div>
                <div
                  className="bg-blue-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
                  style={{ width: `${deliveryPct}%`, minWidth: data.deliveryCount > 0 ? '30px' : '0' }}
                >
                  {deliveryPct > 10 ? <><Truck className="w-3 h-3 mr-1" />{deliveryPct}%</> : ''}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Dine-in ({data.dineInCount})</span>
              <span>Delivery ({data.deliveryCount})</span>
            </div>
          </div>

          {/* Peak Hours */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Peak Hours (7 days)</p>
            <div className="flex flex-wrap gap-2">
              {data.hourlyVolume
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((h, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-800' :
                    i === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {h.label}
                    <span className="text-xs font-normal">({h.value} orders)</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

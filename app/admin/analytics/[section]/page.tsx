'use client'

import { useEffect, useState, use } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/ui/Breadcrumb'
import CSSBarChart from '@/components/ui/CSSBarChart'
import { ArrowLeft, DollarSign, Clock, UtensilsCrossed, Users } from 'lucide-react'
import Link from 'next/link'

const SECTION_CONFIG: Record<string, { title: string; icon: any }> = {
  revenue: { title: 'Revenue Analysis', icon: DollarSign },
  hourly: { title: 'Hourly Order Patterns', icon: Clock },
  items: { title: 'Menu Item Analytics', icon: UtensilsCrossed },
  staff: { title: 'Staff Performance', icon: Users },
}

export default function AnalyticsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const supabase = getSupabaseBrowserClient()

  const config = SECTION_CONFIG[section]

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    const hasAdminSession = session && (Date.now() - JSON.parse(session).timestamp < 24 * 60 * 60 * 1000)
    if (!authLoading && !hasAdminSession && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchData()
  }, [section])

  async function fetchData() {
    if (!supabase) return
    setLoading(true)

    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status, items, assigned_staff_id, order_type')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const { data: tableOrders } = await supabase
        .from('table_orders')
        .select('total_amount, created_at, status, items, table_number')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const { data: staffData } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'staff')
        .eq('is_active', true)

      const allOrders = orders || []
      const allTableOrders = tableOrders || []
      const staffList = staffData || []

      const deliveredOrders = allOrders.filter(o => o.status === 'delivered')
      const completedTableOrders = allTableOrders.filter(o => o.status === 'completed')

      if (section === 'revenue') {
        // Daily revenue for 30 days
        const dailyMap = new Map<string, { delivery: number; dineIn: number }>()
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          dailyMap.set(key, { delivery: 0, dineIn: 0 })
        }
        deliveredOrders.forEach(o => {
          const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (dailyMap.has(key)) {
            const entry = dailyMap.get(key)!
            entry.delivery += o.total_amount
          }
        })
        completedTableOrders.forEach(o => {
          const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (dailyMap.has(key)) {
            const entry = dailyMap.get(key)!
            entry.dineIn += o.total_amount
          }
        })

        const totalRevenue = [...deliveredOrders, ...completedTableOrders].reduce((s, o) => s + o.total_amount, 0)
        const avgDaily = totalRevenue / 30

        setData({
          daily: Array.from(dailyMap.entries()).map(([label, v]) => ({
            label,
            value: v.delivery + v.dineIn,
          })),
          totalRevenue,
          avgDaily,
          totalOrders: deliveredOrders.length + completedTableOrders.length,
        })
      } else if (section === 'hourly') {
        const hourlyMap = new Map<number, number>()
        for (let h = 0; h < 24; h++) hourlyMap.set(h, 0)
        ;[...allOrders, ...allTableOrders].forEach(o => {
          const h = new Date(o.created_at).getHours()
          hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1)
        })

        // Day of week
        const dayMap = new Map<string, number>()
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        days.forEach(d => dayMap.set(d, 0))
        ;[...allOrders, ...allTableOrders].forEach(o => {
          const d = days[new Date(o.created_at).getDay()]
          dayMap.set(d, (dayMap.get(d) || 0) + 1)
        })

        setData({
          hourly: Array.from(hourlyMap.entries())
            .filter(([h]) => h >= 8 && h <= 23)
            .map(([h, v]) => ({ label: `${h}:00`, value: v })),
          byDay: Array.from(dayMap.entries()).map(([label, value]) => ({ label, value })),
          totalOrders: allOrders.length + allTableOrders.length,
        })
      } else if (section === 'items') {
        const itemMap = new Map<string, { count: number; revenue: number }>()
        ;[...allOrders, ...allTableOrders].forEach(o => {
          if (!o.items) return
          o.items.forEach((item: any) => {
            const existing = itemMap.get(item.name) || { count: 0, revenue: 0 }
            existing.count += item.quantity || 1
            existing.revenue += (item.price || 0) * (item.quantity || 1)
            itemMap.set(item.name, existing)
          })
        })
        const items = Array.from(itemMap.entries())
          .map(([name, d]) => ({ name, ...d }))
          .sort((a, b) => b.count - a.count)

        setData({ items, totalItems: items.length })
      } else if (section === 'staff') {
        const staffMap = new Map<string, { orders: number; revenue: number }>()
        deliveredOrders.forEach(o => {
          if (!o.assigned_staff_id) return
          const existing = staffMap.get(o.assigned_staff_id) || { orders: 0, revenue: 0 }
          existing.orders += 1
          existing.revenue += o.total_amount
          staffMap.set(o.assigned_staff_id, existing)
        })

        const performance = Array.from(staffMap.entries())
          .map(([id, perf]) => {
            const s = staffList.find(st => st.id === id)
            return { name: s?.name || 'Unknown', ...perf, avgValue: perf.revenue / (perf.orders || 1) }
          })
          .sort((a, b) => b.orders - a.orders)

        setData({ performance, totalStaff: staffList.length })
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Section not found</p>
          <Link href="/admin" className="text-green-600 hover:underline font-medium">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const Icon = config.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-curry-dark to-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <Breadcrumb items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Analytics', href: '/admin' },
            { label: config.title },
          ]} />
          <div className="flex items-center gap-3 mt-3">
            <Link href="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Icon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">{config.title}</h1>
          </div>
          <p className="text-sm opacity-80 mt-1 ml-12">Last 30 days</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : !data ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No data available</p>
          </div>
        ) : section === 'revenue' ? (
          <div className="space-y-6">
            {/* Revenue KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card border-l-4 border-green-500">
                <p className="text-sm text-gray-500">Total Revenue (30d)</p>
                <p className="text-3xl font-black text-green-700">{formatPrice(data.totalRevenue)}</p>
              </div>
              <div className="card border-l-4 border-blue-500">
                <p className="text-sm text-gray-500">Avg Daily Revenue</p>
                <p className="text-3xl font-black text-blue-700">{formatPrice(data.avgDaily)}</p>
              </div>
              <div className="card border-l-4 border-purple-500">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-3xl font-black text-purple-700">{data.totalOrders}</p>
              </div>
            </div>
            {/* Revenue Chart */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Revenue (30 Days)</h3>
              <CSSBarChart
                data={data.daily}
                height={250}
                orientation="vertical"
                barColor="bg-green-500"
                formatValue={(v) => formatPrice(v)}
              />
            </div>
          </div>
        ) : section === 'hourly' ? (
          <div className="space-y-6">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Total Orders (30d)</p>
              <p className="text-3xl font-black text-gray-800">{data.totalOrders}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Orders by Hour</h3>
                <CSSBarChart data={data.hourly} orientation="horizontal" barColor="bg-blue-500" />
              </div>
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Orders by Day of Week</h3>
                <CSSBarChart data={data.byDay} height={200} orientation="vertical" barColor="bg-purple-500" />
              </div>
            </div>
          </div>
        ) : section === 'items' ? (
          <div className="space-y-6">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Unique Items Ordered</p>
              <p className="text-3xl font-black text-gray-800">{data.totalItems}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">All Menu Items (Ranked by Orders)</h3>
              <div className="space-y-3">
                {data.items.map((item: any, i: number) => {
                  const maxCount = data.items[0]?.count || 1
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-6 text-right">{i + 1}</span>
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
            </div>
          </div>
        ) : section === 'staff' ? (
          <div className="space-y-6">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Active Staff Members</p>
              <p className="text-3xl font-black text-gray-800">{data.totalStaff}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Delivery Staff Leaderboard</h3>
              {data.performance.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No delivery data</p>
              ) : (
                <div className="space-y-3">
                  {data.performance.map((staff: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-200 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {i < 3 ? ['1st', '2nd', '3rd'][i] : `${i + 1}`}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{staff.name}</p>
                          <p className="text-xs text-gray-500">{staff.orders} deliveries &middot; Avg {formatPrice(staff.avgValue)}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-emerald-600">{formatPrice(staff.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

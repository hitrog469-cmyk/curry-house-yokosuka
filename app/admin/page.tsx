'use client'
// v2 - full admin with Orders, Analytics, Reviews, Content nav, Reception nav
import { useEffect, useState, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ClipboardList, BarChart3, Star, Users, Mail, Briefcase, PartyPopper } from 'lucide-react'
import ToggleTabs from '@/components/ui/ToggleTabs'
import Breadcrumb from '@/components/ui/Breadcrumb'
import AdminAnalyticsView from '@/components/admin/AdminAnalyticsView'
import AdminUsersView from '@/components/admin/AdminUsersView'
import AdminContactView from '@/components/admin/AdminContactView'
import AdminCareersView from '@/components/admin/AdminCareersView'
import AdminCateringView from '@/components/admin/AdminCateringView'
import StarRating from '@/components/StarRating'

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  total_amount: number
  status: string
  items: any[]
  created_at: string
  updated_at?: string
  assigned_staff_id?: string
  notes?: string
  order_type?: string
  table_number?: number
  party_size?: number
  split_bill?: boolean
  number_of_splits?: number
  payment_method?: string
  payment_status?: string
}

type TableOrder = {
  id: string
  table_number: number
  items: any[]
  total_amount: number
  status: string
  created_at: string
  customer_name?: string
  party_size?: number
  split_bill?: boolean
  number_of_splits?: number
}

type StaffMember = {
  id: string
  full_name: string
  phone: string
}

type Review = {
  id: string
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
  is_verified: boolean
  is_featured: boolean
  is_hidden: boolean
  order_type: string | null
}

// ─── Admin Reviews sub-view ────────────────────────────────────────────────
function AdminReviewsView({
  reviews,
  loading,
  onToggle,
  onRefresh,
}: {
  reviews: Review[]
  loading: boolean
  onToggle: (id: string, field: 'is_featured' | 'is_hidden', current: boolean) => void
  onRefresh: () => void
}) {
  const visible = reviews.filter(r => !r.is_hidden)
  const avgRating = visible.length
    ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10
    : 0
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-400">
          <p className="text-xs font-semibold text-gray-500 mb-1">Total Reviews</p>
          <p className="text-3xl font-black text-yellow-600">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-400">
          <p className="text-xs font-semibold text-gray-500 mb-1">Avg Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black text-orange-600">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} readOnly size="sm" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-xs font-semibold text-gray-500 mb-1">⭐ Featured</p>
          <p className="text-3xl font-black text-green-700">{reviews.filter(r => r.is_featured).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400">
          <p className="text-xs font-semibold text-gray-500 mb-1">🚫 Hidden</p>
          <p className="text-3xl font-black text-red-600">{reviews.filter(r => r.is_hidden).length}</p>
        </div>
      </div>

      {/* Star distribution */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h3 className="text-sm font-bold text-gray-500 mb-3">RATING DISTRIBUTION</h3>
        <div className="space-y-2">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600 w-4">{star}★</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700">All Reviews ({reviews.length})</h3>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:underline"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Reviews table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent" />
          <p className="mt-3 text-gray-500">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-gray-500">No reviews yet. They'll appear here once customers start leaving feedback.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-xl shadow-sm p-4 border-l-4 transition-all ${
                r.is_hidden
                  ? 'border-red-300 opacity-60'
                  : r.is_featured
                  ? 'border-yellow-400'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0 md:w-48">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {r.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {r.reviewer_name}
                      {r.is_verified && <span className="text-green-600 text-xs ml-1">✓</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-400">{r.order_type || 'online'}</div>
                  </div>
                </div>

                {/* Rating + comment */}
                <div className="flex-1 min-w-0">
                  <StarRating rating={r.rating} readOnly size="sm" />
                  {r.comment && (
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                  )}
                  {!r.comment && (
                    <p className="text-xs text-gray-400 italic mt-1">No comment</p>
                  )}
                </div>

                {/* Badges + actions */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {r.is_featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-lg">⭐ Featured</span>
                  )}
                  {r.is_hidden && (
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-lg">🚫 Hidden</span>
                  )}
                  <button
                    onClick={() => onToggle(r.id, 'is_featured', r.is_featured)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      r.is_featured
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
                    }`}
                  >
                    {r.is_featured ? 'Unfeature' : '⭐ Feature'}
                  </button>
                  <button
                    onClick={() => onToggle(r.id, 'is_hidden', r.is_hidden)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      r.is_hidden
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    {r.is_hidden ? 'Unhide' : '🚫 Hide'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Dashboard ───────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [activeTab, setActiveTab] = useState<'online' | 'dine-in' | 'all'>('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevOrderCountRef = useRef(0)
  const [activeView, setActiveView] = useState<'orders' | 'analytics' | 'reviews' | 'users' | 'contact' | 'careers' | 'catering'>('orders')
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [tablePins, setTablePins] = useState<{table_number: number, pin: string}[]>([])
  const [showPinPanel, setShowPinPanel] = useState(false)
  const [pinPanelLoading, setPinPanelLoading] = useState(false)

  const supabase = getSupabaseBrowserClient()

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
  }, [])

  // Simple auth guard — role is set at login time; just log out and back in after role change
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  const isAuthed = user?.role === 'admin'

  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!supabase || !isAuthed) return
    setLoading(true)

    // Fetch delivery orders only — exclude in-house/table orders
    let query = supabase
      .from('orders')
      .select('*')
      .neq('order_type', 'in-house')
      .order('created_at', { ascending: false })

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus)
    }

    const { data: orderData } = await query
    if (orderData) {
      // Check for new orders and play sound
      if (prevOrderCountRef.current > 0 && orderData.length > prevOrderCountRef.current) {
        playNotificationSound()
      }
      prevOrderCountRef.current = orderData.length
      setOrders(orderData)
    }

    // Fetch table orders (dine-in)
    let tQuery = supabase
      .from('table_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (selectedStatus !== 'all') {
      tQuery = tQuery.eq('status', selectedStatus)
    }

    const { data: tableData } = await tQuery
    if (tableData) setTableOrders(tableData)

    // Fetch staff
    const { data: staffData } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'staff')
      .eq('is_active', true)

    if (staffData) setStaff(staffData.map(s => ({ id: s.id, full_name: s.full_name, phone: s.phone || '' })))

    setLoading(false)
  }, [supabase, isAuthed, selectedStatus, playNotificationSound])

  useEffect(() => { fetchAll() }, [fetchAll])

  const fetchReviews = useCallback(async () => {
    if (!supabase || !isAuthed) return
    setReviewsLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setReviews(data)
    setReviewsLoading(false)
  }, [supabase, isAuthed])

  useEffect(() => {
    if (activeView === 'reviews') fetchReviews()
  }, [activeView, fetchReviews])

  const toggleReviewField = async (id: string, field: 'is_featured' | 'is_hidden', current: boolean) => {
    if (!supabase) return
    await supabase.from('reviews').update({ [field]: !current }).eq('id', id)
    fetchReviews()
  }

  const fetchTablePins = useCallback(async () => {
    if (!supabase || !isAuthed) return
    setPinPanelLoading(true)
    const { data } = await supabase
      .from('table_pins')
      .select('table_number, pin')
      .order('table_number')
    if (data) setTablePins(data)
    setPinPanelLoading(false)
  }, [supabase, isAuthed])

  const regeneratePin = async (tableNumber: number) => {
    if (!supabase) return
    const newPin = String(Math.floor(1000 + Math.random() * 9000))
    await supabase.from('table_pins').upsert(
      { table_number: tableNumber, pin: newPin, updated_at: new Date().toISOString() },
      { onConflict: 'table_number' }
    )
    fetchTablePins()
  }

  const regenerateAllPins = async () => {
    if (!supabase) return
    if (!window.confirm('Regenerate ALL 18 table PINs? Print new table cards afterwards.')) return
    const rows = Array.from({ length: 18 }, (_, i) => ({
      table_number: i + 1,
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      updated_at: new Date().toISOString(),
    }))
    await supabase.from('table_pins').upsert(rows, { onConflict: 'table_number' })
    fetchTablePins()
  }

  // Real-time subscription for new orders
  useEffect(() => {
    if (!supabase || !isAuthed) return

    const channel = supabase
      .channel('admin_order_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        playNotificationSound()
        fetchAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_orders' }, () => {
        playNotificationSound()
        fetchAll()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, isAuthed, fetchAll, playNotificationSound])

  // Order actions
  async function updateOrderStatus(orderId: string, newStatus: string, isTableOrder = false) {
    if (!supabase) return
    const table = isTableOrder ? 'table_orders' : 'orders'
    await supabase.from(table).update({ status: newStatus }).eq('id', orderId)
    fetchAll()
  }

  async function assignStaff(orderId: string, staffId: string) {
    if (!supabase) return
    await supabase.from('orders').update({ assigned_staff_id: staffId, status: 'preparing' }).eq('id', orderId)
    fetchAll()
  }

  // Print kitchen slip
  const printKitchenSlip = (items: any[], tableNum: number | undefined, orderId: string, customerName: string, isDelivery: boolean) => {
    // 58mm thermal paper (MPSB20) = 220px at 96dpi — opening at this width forces Safari/iPad to render at receipt width
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
        .header { text-align: center; border-bottom: 3px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
        .type-badge { background: ${isDelivery ? '#2563eb' : '#7c3aed'}; color: white; padding: 2px 6px; font-size: 8pt; font-weight: bold; display: inline-block; margin: 2px 0; }
        .table-number { font-size: 28pt; font-weight: bold; text-align: center; margin: 5px 0; border: 3px solid #000; padding: 4px; }
        .timestamp { text-align: center; font-size: 7pt; color: #666; margin-bottom: 5px; }
        .items { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 5px 0; margin: 5px 0; }
        .item { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #ccc; }
        .item:last-child { border-bottom: none; }
        .item-name { flex: 1; font-weight: bold; word-break: break-word; font-size: 8pt; }
        .item-details { font-size: 7pt; color: #666; }
        .item-qty { font-size: 12pt; font-weight: bold; min-width: 28px; text-align: right; }
        .customer { text-align: center; font-size: 8pt; margin: 3px 0; font-weight: bold; }
        .footer { text-align: center; font-size: 7pt; color: #666; margin-top: 6px; }
        @media print { @page { size: 58mm auto; margin: 0mm; } html, body { width: 58mm !important; margin: 0mm !important; } }
      </style></head><body>
        <div class="header">
          <h1 style="font-size:16px;">🍛 KITCHEN ORDER</h1>
          <span class="type-badge">${isDelivery ? '🚗 DELIVERY' : '🍽️ TABLE ORDER'}</span>
        </div>
        ${tableNum ? `<div class="table-number">T${tableNum}</div>` : ''}
        ${isDelivery ? `<div class="table-number" style="font-size:24px;">🚗 DELIVERY</div>` : ''}
        <div class="customer">${customerName || 'Guest'}</div>
        <div class="timestamp">${new Date().toLocaleString('ja-JP')}</div>
        <div class="items">
          ${items.map(item => `
            <div class="item">
              <div>
                <div class="item-name">${item.name}</div>
                ${item.spiceLevel ? `<div class="item-details">🌶️ ${item.spiceLevel}</div>` : ''}
                ${item.addOns?.length ? `<div class="item-details">+ ${item.addOns.map((a: any) => a.name).join(', ')}</div>` : ''}
                ${item.variation ? `<div class="item-details">• ${item.variation.name}</div>` : ''}
              </div>
              <div class="item-qty">×${item.quantity}</div>
            </div>
          `).join('')}
        </div>
        <div class="footer">ID: ${orderId.slice(0, 8)}</div>
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.document.title = ''
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    }, 250)
  }

  // Print customer bill / PDF receipt
  const printBill = (order: Order | TableOrder, isTableOrder: boolean) => {
    const items = order.items || []
    const subtotal = order.total_amount
    const total = subtotal
    const customerName = isTableOrder ? (order as TableOrder).customer_name : (order as Order).customer_name
    const tableNum = isTableOrder ? (order as TableOrder).table_number : (order as Order).table_number
    const partySize = isTableOrder ? (order as TableOrder).party_size : (order as Order).party_size
    const splitBill = isTableOrder ? (order as TableOrder).split_bill : (order as Order).split_bill
    const numSplits = isTableOrder ? (order as TableOrder).number_of_splits : (order as Order).number_of_splits
    const isDelivery = !isTableOrder && (order as Order).order_type !== 'in-house'

    let splitInfo = ''
    if (splitBill && numSplits && numSplits > 1) {
      const perPerson = Math.ceil(total / numSplits)
      splitInfo = `
        <div class="split-section">
          <div style="font-weight:bold;margin-bottom:5px;">📋 BILL SPLIT (${numSplits} people)</div>
          <div style="font-size:18px;font-weight:bold;">Per Person: ${formatPrice(perPerson)}</div>
        </div>
      `
    }

    // Build fully itemised line rows for each order item
    const buildItemRows = (item: any): string => {
      const addonRows = (item.addOns || []).map((a: any) => {
        const n = typeof a === 'string' ? a : a.name
        const p = typeof a !== 'string' ? (a.price || 0) : 0
        return `<div class="sub-row addon"><span class="sn">＋ ${n}</span><span class="sq"></span><span class="sp">${p > 0 ? '+¥' + p : ''}</span></div>`
      }).join('')

      const upgradeRows = (item.setMealChoices?.upgradeDetails || []).map((d: string) => {
        const m = d.match(/\+¥(\d+)/)
        const p = m ? parseInt(m[1]) : 0
        const lbl = d.replace(/\s*\(\+¥\d+\)\s*$/, '').trim()
        return `<div class="sub-row upgrade"><span class="sn">⬆️ ${lbl}</span><span class="sq"></span><span class="sp">+¥${p}</span></div>`
      }).join('')

      return `
        <div class="iblock">
          <div class="row">
            <span class="rn"><b>${item.name}${item.variation ? ` (${item.variation})` : ''}</b></span>
            <span class="rq">×${item.quantity}</span>
            <span class="rp">${formatPrice((item.price || 0) * (item.quantity || 1))}</span>
          </div>
          ${item.spiceLevel ? `<div class="sub-row info"><span class="sn">🌶️ ${item.spiceLevel}</span><span class="sq"></span><span class="sp"></span></div>` : ''}
          ${item.setMealChoices?.curries?.length ? `<div class="sub-row info"><span class="sn">🍛 ${item.setMealChoices.curries.join(' + ')}</span><span class="sq"></span><span class="sp"></span></div>` : ''}
          ${item.setMealChoices?.naan ? `<div class="sub-row info"><span class="sn">🫓 ${item.setMealChoices.naan}</span><span class="sq"></span><span class="sp"></span></div>` : ''}
          ${item.setMealChoices?.rice ? `<div class="sub-row info"><span class="sn">🍚 ${item.setMealChoices.rice}</span><span class="sq"></span><span class="sp"></span></div>` : ''}
          ${item.setMealChoices?.drink ? `<div class="sub-row info"><span class="sn">🥤 ${item.setMealChoices.drink}</span><span class="sq"></span><span class="sp"></span></div>` : ''}
          ${addonRows}
          ${upgradeRows}
        </div>`
    }

    // 58mm thermal paper (MPSB20) = 220px at 96dpi — opening at this width forces Safari/iPad to render at receipt width
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
        .info .table-num { font-size: 12pt; font-weight: bold; }
        .info .detail { font-size: 7pt; color: #666; }
        /* Main item row */
        .iblock { border-bottom: 1px dotted #bbb; padding: 2px 0 4px; margin-bottom: 2px; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .rn { flex: 1; word-break: break-word; padding-right: 2px; font-size: 8pt; }
        .rq { width: 20px; text-align: center; flex-shrink: 0; font-size: 8pt; }
        .rp { width: 48px; text-align: right; font-weight: bold; flex-shrink: 0; font-size: 8pt; }
        /* Sub-item rows */
        .sub-row { display: flex; justify-content: space-between; padding: 1px 0; }
        .sn { flex: 1; word-break: break-word; padding-left: 6px; font-size: 7pt; }
        .sq { width: 20px; flex-shrink: 0; }
        .sp { width: 48px; text-align: right; flex-shrink: 0; font-size: 7pt; }
        .info .sn { color: #555; }
        .addon .sn { color: #444; } .addon .sp { color: #444; }
        .upgrade .sn { color: #b35900; font-weight: bold; } .upgrade .sp { color: #b35900; font-weight: bold; }
        /* Totals */
        .totals { border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 8pt; }
        .grand-total { font-size: 11pt; font-weight: bold; border-top: 2px solid #000; margin-top: 3px; padding-top: 3px; }
        .split-section { border: 1px dashed #000; padding: 3px; margin: 4px 0; text-align: center; font-size: 8pt; }
        .payment { text-align: center; margin: 4px 0; padding: 3px; border: 1px solid #ccc; font-size: 8pt; }
        .footer { text-align: center; margin-top: 6px; }
        .footer .thanks { font-size: 9pt; font-weight: bold; margin-bottom: 3px; }
        .footer p { font-size: 7pt; color: #666; }
        @media print { @page { size: 58mm auto; margin: 0mm; } html, body { width: 58mm !important; margin: 0mm !important; } }
      </style></head><body>
        <div class="header">
          <h1>🍛 THE CURRY HOUSE</h1>
          <p>YOKOSUKA ・ ザ・カリーハウス横須賀</p>
          <p>Tel: 046-813-5869</p>
        </div>
        <div class="divider"></div>
        <div class="info">
          ${tableNum ? `<div class="table-num">TABLE ${tableNum}</div>` : ''}
          ${isDelivery ? `<div class="table-num">🚗 DELIVERY</div>` : ''}
          ${customerName ? `<div class="detail">Customer: ${customerName}</div>` : ''}
          ${partySize ? `<div class="detail">Party: ${partySize} guests</div>` : ''}
          <div class="detail">${new Date(order.created_at).toLocaleString('ja-JP')}</div>
          <div class="detail">Order #${order.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div>
          <div class="row" style="font-weight:bold;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:3px;">
            <span class="rn">ITEM</span>
            <span class="rq">QTY</span>
            <span class="rp">PRICE</span>
          </div>
          ${items.map(buildItemRows).join('')}
        </div>
        <div class="totals">
          <div class="total-row">
            <span>Subtotal / 小計</span>
            <span>${formatPrice(subtotal)}</span>
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
        ${!isTableOrder && (order as Order).payment_method ? `
          <div class="payment">
            💰 Payment: ${(order as Order).payment_method?.toUpperCase()}
            ${(order as Order).payment_status ? ` (${(order as Order).payment_status})` : ''}
          </div>
        ` : ''}
        <div class="footer">
          <div class="thanks">Thank You! ありがとうございました!</div>
          <p>Please visit us again!</p>
          <p>またのお越しをお待ちしております</p>
          <p style="margin-top:8px;">───────────────────</p>
        </div>
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.document.title = ''
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    }, 250)
  }

  // Stats
  const allOnlineOrders = orders
  const allTableOrders = tableOrders
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayOnline = orders.filter(o => new Date(o.created_at) >= todayStart)
  const todayTable = tableOrders.filter(o => new Date(o.created_at) >= todayStart)

  const stats = {
    totalOnline: todayOnline.length,
    totalTable: todayTable.length,
    pendingOnline: todayOnline.filter(o => o.status === 'pending').length,
    pendingTable: todayTable.filter(o => o.status === 'pending').length,
    preparingAll: todayOnline.filter(o => o.status === 'preparing').length + todayTable.filter(o => o.status === 'preparing').length,
    deliveredToday: todayOnline.filter(o => o.status === 'delivered').length,
    completedTable: todayTable.filter(o => o.status === 'completed').length,
    revenueOnline: todayOnline.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0),
    revenueTable: todayTable.filter(o => o.status === 'completed').reduce((s, o) => s + o.total_amount, 0),
  }

  const getStatusColor = (status: string) => {
    const c: any = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      preparing: 'bg-blue-100 text-blue-800 border-blue-300',
      out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    }
    return c[status] || c.pending
  }

  const getStatusIcon = (status: string) => {
    const i: any = { pending: '⏳', preparing: '👨‍🍳', out_for_delivery: '🚗', delivered: '✅', completed: '✅', cancelled: '❌' }
    return i[status] || '⏳'
  }

  const getTimeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  // Filter orders by tab
  const getFilteredOrders = () => {
    if (activeTab === 'online') return orders.map(o => ({ ...o, _type: 'online' as const }))
    if (activeTab === 'dine-in') return tableOrders.map(o => ({ ...o, _type: 'table' as const }))
    // Combine all, sorted by date
    const combined = [
      ...orders.map(o => ({ ...o, _type: 'online' as const })),
      ...tableOrders.map(o => ({ ...o, _type: 'table' as const, customer_name: o.customer_name || 'Table Guest', customer_phone: '', delivery_address: '' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return combined
  }

  const filteredOrders = getFilteredOrders()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400 font-semibold">Verifying access...</p>
        </div>
      </div>
    )
  }
  if (!isAuthed) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Audio for notifications */}
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <Breadcrumb items={[{ label: 'Admin Dashboard' }]} />
              <h1 className="text-3xl font-bold mt-2">Admin Dashboard</h1>
              <p className="text-sm opacity-80">The Curry House Yokosuka</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/admin/content" className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Content
              </Link>
              <Link href="/reception" className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Reception
              </Link>
              <Link href="/staff/dashboard" className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Staff
              </Link>
              <Link href="/kitchen" className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Kitchen
              </Link>
              <Link href="/" className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition-colors">
                Home
              </Link>
            </div>
          </div>
          <ToggleTabs
            tabs={[
              { id: 'orders', label: 'Orders', icon: ClipboardList, badge: stats.pendingOnline + stats.pendingTable },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'contact', label: 'Contact', icon: Mail },
              { id: 'careers', label: 'Careers', icon: Briefcase },
              { id: 'catering', label: 'Catering', icon: PartyPopper },
              { id: 'users', label: 'Users', icon: Users },
            ]}
            activeTab={activeView}
            onChange={(id) => setActiveView(id as 'orders' | 'analytics' | 'reviews' | 'users' | 'contact' | 'careers' | 'catering')}
            size="sm"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Analytics View */}
        {activeView === 'analytics' ? (
          <AdminAnalyticsView />
        ) : activeView === 'reviews' ? (
          <AdminReviewsView
            reviews={reviews}
            loading={reviewsLoading}
            onToggle={toggleReviewField}
            onRefresh={fetchReviews}
          />
        ) : activeView === 'users' ? (
          <AdminUsersView />
        ) : activeView === 'contact' ? (
          <AdminContactView />
        ) : activeView === 'careers' ? (
          <AdminCareersView />
        ) : activeView === 'catering' ? (
          <AdminCateringView />
        ) : (
        <>
        {/* ── Table PIN Management ──────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setShowPinPanel(v => { if (!v) fetchTablePins(); return !v }) }}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-purple-200"
            >
              🔐 Table PINs {showPinPanel ? '▲' : '▼'}
            </button>
            {showPinPanel && (
              <button
                onClick={regenerateAllPins}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-xl font-bold text-sm transition-all border border-orange-200"
              >
                🔄 Regenerate ALL PINs
              </button>
            )}
          </div>

          {showPinPanel && (
            <div className="mt-3 bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
              <p className="text-sm text-gray-500 mb-4">
                Each table has a physical PIN card. Customers enter this PIN when scanning the QR code to prevent orders from outside the restaurant.
              </p>
              {pinPanelLoading ? (
                <div className="text-center text-gray-400 py-4">Loading PINs...</div>
              ) : tablePins.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No PINs found. Run the SQL setup in Supabase first, then click the button above to load.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {tablePins.map(tp => (
                    <div key={tp.table_number} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200 hover:border-purple-300 transition-all">
                      <div className="text-xs font-bold text-gray-500 mb-1">TABLE {tp.table_number}</div>
                      <div className="text-2xl font-black text-gray-900 tracking-widest mb-2 font-mono">{tp.pin}</div>
                      <button
                        onClick={() => regeneratePin(tp.table_number)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-1.5 rounded-lg transition-all"
                        title={`New PIN for Table ${tp.table_number}`}
                      >
                        🔄 New PIN
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-xs font-semibold text-gray-500 mb-1">Online Orders</p>
            <p className="text-3xl font-black text-blue-700">{stats.totalOnline}</p>
            <p className="text-xs text-gray-400">{stats.pendingOnline} pending</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
            <p className="text-xs font-semibold text-gray-500 mb-1">🍽️ Table Orders</p>
            <p className="text-3xl font-black text-purple-700">{stats.totalTable}</p>
            <p className="text-xs text-gray-400">{stats.pendingTable} pending</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
            <p className="text-xs font-semibold text-gray-500 mb-1">👨‍🍳 Preparing</p>
            <p className="text-3xl font-black text-orange-700">{stats.preparingAll}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-xs font-semibold text-gray-500 mb-1">✅ Completed</p>
            <p className="text-3xl font-black text-green-700">{stats.deliveredToday + stats.completedTable}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-emerald-500">
            <p className="text-xs font-semibold text-gray-500 mb-1">💰 Online Revenue</p>
            <p className="text-2xl font-black text-emerald-700">{formatPrice(stats.revenueOnline)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-teal-500">
            <p className="text-xs font-semibold text-gray-500 mb-1">💰 Table Revenue</p>
            <p className="text-2xl font-black text-teal-700">{formatPrice(stats.revenueTable)}</p>
          </div>
        </div>

        {/* Tabs: Online / Dine-In / All */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
            {(['all', 'online', 'dine-in'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'all' && '📋 All Orders'}
                {tab === 'online' && '🚗 Online / Delivery'}
                {tab === 'dine-in' && '🍽️ Dine-In / Table'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 ml-auto">
            {['all', 'pending', 'preparing', 'delivered', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedStatus === status
                    ? 'bg-green-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All' : `${getStatusIcon(status)} ${status.charAt(0).toUpperCase() + status.slice(1)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent" />
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order: any) => {
              const isTable = order._type === 'table'
              const isExpanded = expandedOrder === order.id
              const isPending = order.status === 'pending'

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all border-l-4 ${
                    isPending ? 'border-yellow-500 ring-1 ring-yellow-200' :
                    order.status === 'preparing' ? 'border-blue-500' :
                    order.status === 'delivered' || order.status === 'completed' ? 'border-green-500' :
                    'border-gray-200'
                  } ${order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled' ? 'opacity-45' : ''}`}
                >
                  {/* Order Header - Always visible */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Type badge */}
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${
                          isTable ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isTable ? `🍽️ T${order.table_number}` : '🚗 Delivery'}
                        </span>

                        {/* Status badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>

                        {/* Customer */}
                        <span className="font-bold text-gray-900">
                          {order.customer_name || 'Guest'}
                        </span>

                        {/* Time */}
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(order.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Items count */}
                        <span className="text-xs text-gray-500">
                          {order.items?.length || 0} items
                        </span>

                        {/* Total */}
                        <span className="text-lg font-black text-green-700">
                          {formatPrice(order.total_amount)}
                        </span>

                        {/* Expand icon */}
                        <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Items */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 mb-2">ORDER ITEMS</h4>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                                <div className="flex justify-between">
                                  <div>
                                    <span className="font-bold">{item.name}</span>
                                    {item.variation && <span className="text-purple-600 ml-1 text-xs font-semibold">({item.variation})</span>}
                                    {item.spiceLevel && <span className="text-orange-500 ml-1 text-xs">🌶️ {item.spiceLevel}</span>}
                                  </div>
                                  <span className="font-bold whitespace-nowrap ml-2">×{item.quantity} {formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                                </div>
                                {/* Add-ons */}
                                {item.addOns?.length > 0 && (
                                  <div className="ml-3 mt-1 space-y-0.5">
                                    {item.addOns.map((a: any, i: number) => (
                                      <div key={i} className="text-xs text-gray-500">＋ {typeof a === 'string' ? a : `${a.name}${a.price ? ` (+${formatPrice(a.price)})` : ''}`}</div>
                                    ))}
                                  </div>
                                )}
                                {/* Set meal choices */}
                                {item.setMealChoices && (
                                  <div className="ml-3 mt-1 space-y-0.5">
                                    {item.setMealChoices.curries?.length > 0 && (
                                      <div className="text-xs text-indigo-600">🍛 {item.setMealChoices.curries.join(', ')}</div>
                                    )}
                                    {item.setMealChoices.naan && <div className="text-xs text-amber-600">🫓 {item.setMealChoices.naan}</div>}
                                    {item.setMealChoices.rice && <div className="text-xs text-green-600">🍚 {item.setMealChoices.rice}</div>}
                                    {item.setMealChoices.drink && <div className="text-xs text-blue-600">🥤 {item.setMealChoices.drink}</div>}
                                    {item.setMealChoices.upgradeDetails?.length > 0 && (
                                      <div className="text-xs text-orange-500 font-semibold">⬆️ {item.setMealChoices.upgradeDetails.join(', ')}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                              <span>Subtotal</span>
                              <span>{formatPrice(order.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Tax (10%)</span>
                              <span>{formatPrice(Math.floor(order.total_amount * 0.1))}</span>
                            </div>
                            <div className="flex justify-between font-black text-lg text-green-700 border-t pt-2">
                              <span>TOTAL</span>
                              <span>{formatPrice(order.total_amount + Math.floor(order.total_amount * 0.1))}</span>
                            </div>
                          </div>
                          {order.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">💬 {order.notes}</p>
                          )}
                          {order.split_bill && order.number_of_splits && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs">
                              <span className="font-bold">📋 Split Bill:</span> {order.number_of_splits} ways • {formatPrice(Math.ceil((order.total_amount + Math.floor(order.total_amount * 0.1)) / order.number_of_splits))} each
                            </div>
                          )}
                        </div>

                        {/* Customer Info */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 mb-2">CUSTOMER INFO</h4>
                          <div className="space-y-2 text-sm">
                            {order.customer_phone && (
                              <div className="flex items-center gap-2">
                                <span>📞</span>
                                <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">{order.customer_phone}</a>
                              </div>
                            )}
                            {order.delivery_address && (
                              <div className="flex items-start gap-2">
                                <span>📍</span>
                                <span>{order.delivery_address}</span>
                              </div>
                            )}
                            {order.party_size && (
                              <div className="flex items-center gap-2">
                                <span>👥</span>
                                <span>{order.party_size} guests</span>
                              </div>
                            )}
                            {order.payment_method && (
                              <div className="flex items-center gap-2">
                                <span>💳</span>
                                <span>{order.payment_method}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-400">
                              <span>🕐</span>
                              <span>{new Date(order.created_at).toLocaleString('ja-JP')}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {order.id.slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 mb-2">ACTIONS</h4>
                          <div className="space-y-2">
                            {/* Status change */}
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value, isTable)}
                              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold"
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="preparing">👨‍🍳 Preparing</option>
                              {!isTable && <option value="out_for_delivery">🚗 Out for Delivery</option>}
                              {!isTable && <option value="delivered">✅ Delivered</option>}
                              {isTable && <option value="completed">✅ Completed</option>}
                              <option value="cancelled">❌ Cancelled</option>
                            </select>

                            {/* Staff assignment (delivery only) */}
                            {!isTable && (
                              <select
                                value={order.assigned_staff_id || ''}
                                onChange={(e) => assignStaff(order.id, e.target.value)}
                                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm"
                              >
                                <option value="">🧑‍💼 Assign Staff</option>
                                {staff.map(s => (
                                  <option key={s.id} value={s.id}>{s.full_name} {s.phone ? `(${s.phone})` : ''}</option>
                                ))}
                              </select>
                            )}

                            {/* Print buttons */}
                            <button
                              onClick={() => printKitchenSlip(order.items, order.table_number, order.id, order.customer_name || 'Guest', !isTable)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                              🖨️ Print Kitchen Slip
                            </button>

                            <button
                              onClick={() => printBill(order, isTable)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                              🧾 Print Bill / Receipt
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}

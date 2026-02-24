'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { playNewOrderSound, enableAudio } from '@/lib/notification-sound'

interface SetMealChoices {
  curries?: string[]
  naan?: string
  rice?: string
  drink?: string
  upgradeDetails?: string[]
}

interface OrderItem {
  item_id: string
  name: string
  quantity: number
  price: number
  subtotal: number
  spiceLevel?: string | null
  addOns?: (string | { name: string; price?: number })[]
  variation?: string | null
  setMealChoices?: SetMealChoices | null
}

interface TableOrder {
  id: string
  table_number: number
  items: OrderItem[]
  total_amount: number
  status: string
  created_at: string
  customer_name?: string
  party_size?: number
  split_bill?: boolean
  number_of_splits?: number
  is_addon?: boolean
  notes?: string
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<TableOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const supabase = getSupabaseBrowserClient()

  const handleEnableAudio = useCallback(async () => {
    if (!audioEnabled) {
      const ok = await enableAudio()
      if (ok) setAudioEnabled(true)
    }
  }, [audioEnabled])

  const playNotificationSound = useCallback(() => {
    if (audioEnabled) {
      playNewOrderSound(0.9)
    }
  }, [audioEnabled])

  // Fetch active + today's completed orders
  const fetchOrders = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    try {
      // Active orders
      const { data: activeData } = await supabase
        .from('table_orders')
        .select('*')
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true })
      setOrders(activeData || [])

      // Completed today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { data: completedData } = await supabase
        .from('table_orders')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(15)
      setCompletedOrders(completedData || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const markAsPreparing = async (orderId: string) => {
    if (!supabase) return
    await supabase.from('table_orders').update({ status: 'preparing' }).eq('id', orderId)
    fetchOrders()
  }

  const completeOrder = async (orderId: string) => {
    if (!supabase) return
    await supabase.from('table_orders').update({ status: 'completed' }).eq('id', orderId)
    fetchOrders()
  }

  // ─── 58mm Kitchen Slip ───────────────────────────────────────────────────
  const printKitchenSlip = (order: TableOrder) => {
    const printWindow = window.open('', '', 'width=220,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title></title>
      <meta name="viewport" content="width=220">
      <style>
        @page { size: 58mm auto; margin: 0mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html { width: 58mm; margin: 0; padding: 0; background: white; }
        body { width: 58mm; margin: 0; padding: 2mm 1.5mm; font-family: 'Courier New', monospace; font-size: 8pt; background: white; }
        .header { text-align: center; border-bottom: 3px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
        .table-num { font-size: 28pt; font-weight: bold; text-align: center; margin: 5px 0; border: 3px solid #000; padding: 4px; }
        .timestamp { text-align: center; font-size: 7pt; color: #666; margin-bottom: 5px; }
        .items { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 5px 0; margin: 5px 0; }
        .item { padding: 3px 0; border-bottom: 1px dotted #ccc; }
        .item:last-child { border-bottom: none; }
        .item-header { display: flex; justify-content: space-between; }
        .item-name { flex: 1; font-weight: bold; word-break: break-word; font-size: 8pt; }
        .item-qty { font-size: 14pt; font-weight: bold; min-width: 28px; text-align: right; }
        .sub { font-size: 7pt; padding-left: 4px; margin-top: 1px; }
        .spice { color: #c00; font-weight: bold; }
        .upgrade { color: #c47000; font-weight: bold; }
        .customer { text-align: center; font-size: 8pt; margin: 3px 0; font-weight: bold; }
        .footer { text-align: center; font-size: 7pt; color: #666; margin-top: 6px; }
        @media print { @page { size: 58mm auto; margin: 0mm; } html, body { width: 58mm !important; margin: 0 !important; } }
      </style></head><body>
        <div class="header">
          <h1 style="font-size:14px;">🍛 KITCHEN ORDER</h1>
          ${order.is_addon ? '<div style="font-weight:bold;font-size:9pt;border:1px solid #000;padding:2px;">⚡ ADD-ON ORDER</div>' : ''}
        </div>
        <div class="table-num">T${order.table_number}</div>
        <div class="customer">${order.customer_name || 'Guest'}${order.party_size ? ` · ${order.party_size} pax` : ''}</div>
        <div class="timestamp">${new Date(order.created_at).toLocaleString('ja-JP')}</div>
        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <div class="item-header">
                <div class="item-name">${item.name}${item.variation ? ` (${item.variation})` : ''}</div>
                <div class="item-qty">×${item.quantity}</div>
              </div>
              ${item.spiceLevel ? `<div class="sub spice">🌶️ ${item.spiceLevel}</div>` : ''}
              ${item.addOns?.length ? `<div class="sub">＋ ${item.addOns.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}</div>` : ''}
              ${item.setMealChoices?.curries?.length ? `<div class="sub">🍛 ${item.setMealChoices.curries.join(' + ')}</div>` : ''}
              ${item.setMealChoices?.naan ? `<div class="sub">🫓 ${item.setMealChoices.naan}</div>` : ''}
              ${item.setMealChoices?.rice ? `<div class="sub">🍚 ${item.setMealChoices.rice}</div>` : ''}
              ${item.setMealChoices?.drink ? `<div class="sub">🥤 ${item.setMealChoices.drink}</div>` : ''}
              ${item.setMealChoices?.upgradeDetails?.length ? `<div class="sub upgrade">⬆️ ${item.setMealChoices.upgradeDetails.join(', ')}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="footer">ID: ${order.id.slice(0, 8).toUpperCase()}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.document.title = ''
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    }
  }

  // ─── 58mm Customer Bill ───────────────────────────────────────────────────
  const printBill = (order: TableOrder) => {
    const items = order.items || []
    const total = order.total_amount
    const splitBill = order.split_bill
    const numSplits = order.number_of_splits

    let splitInfo = ''
    if (splitBill && numSplits && numSplits > 1) {
      const perPerson = Math.ceil(total / numSplits)
      splitInfo = `
        <div style="border:1px dashed #000;padding:3px;margin:4px 0;text-align:center;font-size:8pt;">
          <div style="font-weight:bold;margin-bottom:3px;">📋 SPLIT BILL (${numSplits} people)</div>
          <div style="font-size:16px;font-weight:bold;">Per Person: ${formatPrice(perPerson)}</div>
        </div>
      `
    }

    const printWindow = window.open('', '', 'width=220,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title></title>
      <meta name="viewport" content="width=220">
      <style>
        @page { size: 58mm auto; margin: 0mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html { width: 58mm; margin: 0; padding: 0; background: white; }
        body { width: 58mm; margin: 0; padding: 2mm 1.5mm; font-family: 'Courier New', monospace; font-size: 8pt; background: white; }
        .header { text-align: center; margin-bottom: 5px; }
        .divider { border-top: 2px dashed #000; margin: 4px 0; }
        .info { text-align: center; margin: 4px 0; }
        .item { display: flex; justify-content: space-between; padding: 2px 0; }
        .item-name { flex: 1; word-break: break-word; padding-right: 2px; font-size: 8pt; }
        .item-qty { width: 20px; text-align: center; flex-shrink: 0; font-size: 8pt; }
        .item-price { width: 46px; text-align: right; font-weight: bold; flex-shrink: 0; font-size: 8pt; }
        .sub { font-size: 7pt; color: #555; padding-left: 4px; }
        .totals { border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 8pt; }
        .grand-total { font-size: 11pt; font-weight: bold; border-top: 2px solid #000; margin-top: 3px; padding-top: 3px; }
        .footer { text-align: center; margin-top: 6px; font-size: 8pt; }
        @media print { @page { size: 58mm auto; margin: 0mm; } html, body { width: 58mm !important; margin: 0 !important; } }
      </style></head><body>
        <div class="header">
          <h1 style="font-size:10pt;font-weight:bold;">🍛 THE CURRY HOUSE</h1>
          <p style="font-size:7pt;color:#666;">YOKOSUKA ・ ザ・カリーハウス横須賀</p>
          <p style="font-size:7pt;color:#666;">Tel: 046-813-5869</p>
        </div>
        <div class="divider"></div>
        <div class="info">
          <div style="font-size:12pt;font-weight:bold;">TABLE ${order.table_number}</div>
          ${order.customer_name ? `<div style="font-size:7pt;color:#666;">Customer: ${order.customer_name}</div>` : ''}
          ${order.party_size ? `<div style="font-size:7pt;color:#666;">Party: ${order.party_size} guests</div>` : ''}
          <div style="font-size:7pt;color:#666;">${new Date(order.created_at).toLocaleString('ja-JP')}</div>
          <div style="font-size:7pt;color:#666;">Order #${order.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div>
          <div class="item" style="font-weight:bold;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px;">
            <span class="item-name">ITEM</span>
            <span class="item-qty">QTY</span>
            <span class="item-price">PRICE</span>
          </div>
          ${items.map((item: OrderItem) => `
            <div class="item">
              <span class="item-name">${item.name}${item.variation ? ` (${item.variation})` : ''}</span>
              <span class="item-qty">×${item.quantity}</span>
              <span class="item-price">${formatPrice((item.price || 0) * (item.quantity || 1))}</span>
            </div>
            ${item.spiceLevel ? `<div class="sub">🌶️ ${item.spiceLevel}</div>` : ''}
            ${item.addOns?.map((a: any) => `<div class="sub">＋ ${typeof a === 'string' ? a : a.name}${typeof a !== 'string' && a.price ? ` (+${formatPrice(a.price)})` : ''}</div>`).join('') || ''}
            ${item.setMealChoices?.curries?.length ? `<div class="sub">🍛 ${item.setMealChoices.curries.join(' + ')}</div>` : ''}
            ${item.setMealChoices?.naan ? `<div class="sub">🫓 ${item.setMealChoices.naan}</div>` : ''}
            ${item.setMealChoices?.rice ? `<div class="sub">🍚 ${item.setMealChoices.rice}</div>` : ''}
            ${item.setMealChoices?.drink ? `<div class="sub">🥤 ${item.setMealChoices.drink}</div>` : ''}
            ${item.setMealChoices?.upgradeDetails?.length ? `<div class="sub" style="color:#c47000;font-weight:bold;">⬆️ ${item.setMealChoices.upgradeDetails.join(', ')}</div>` : ''}
          `).join('')}
        </div>
        <div class="totals">
          <div class="total-row">
            <span>Subtotal / 小計</span>
            <span>${formatPrice(total)}</span>
          </div>
          <div class="total-row" style="font-size:7pt;color:#666;">
            <span>Tax Included / 消費税込</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL / 合計</span>
            <span>${formatPrice(total)}</span>
          </div>
        </div>
        ${splitInfo}
        <div class="footer">
          <div style="font-weight:bold;margin-bottom:3px;">Thank You! ありがとうございました!</div>
          <p style="font-size:7pt;color:#666;">Please visit us again!</p>
          <p style="font-size:7pt;color:#666;">またのお越しをお待ちしております</p>
          <p style="margin-top:8px;">───────────────────</p>
        </div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.document.title = ''
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    }
  }

  // Keyboard shortcut: Enter prints kitchen slip for selected order
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedOrder) {
        const order = orders.find(o => o.id === selectedOrder)
        if (order) printKitchenSlip(order)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedOrder, orders])

  // Real-time subscription
  useEffect(() => {
    fetchOrders()
    if (!supabase) return

    const channel = supabase
      .channel('kitchen_order_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_orders' }, (payload) => {
        console.log('Order change:', payload)
        playNotificationSound()
        fetchOrders()
      })
      .subscribe()

    return () => { supabase?.removeChannel(channel) }
  }, [fetchOrders, playNotificationSound, supabase])

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')

  // ─── Sub-item display helper ─────────────────────────────────────────────
  const SubItems = ({ item }: { item: OrderItem }) => {
    const hasSubItems =
      item.spiceLevel ||
      (item.addOns && item.addOns.length > 0) ||
      item.setMealChoices

    if (!hasSubItems) return null

    return (
      <div className="mt-1.5 ml-2 pl-2 border-l-2 border-gray-600 space-y-0.5">
        {item.spiceLevel && (
          <div className="text-xs text-red-300 font-semibold">🌶️ {item.spiceLevel}</div>
        )}
        {item.addOns && item.addOns.length > 0 && (
          <div className="text-xs text-gray-300">
            ＋ {item.addOns.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
          </div>
        )}
        {item.setMealChoices?.curries && item.setMealChoices.curries.length > 0 && (
          <div className="text-xs text-yellow-300">🍛 {item.setMealChoices.curries.join(' + ')}</div>
        )}
        {item.setMealChoices?.naan && (
          <div className="text-xs text-amber-300">🫓 {item.setMealChoices.naan}</div>
        )}
        {item.setMealChoices?.rice && (
          <div className="text-xs text-green-300">🍚 {item.setMealChoices.rice}</div>
        )}
        {item.setMealChoices?.drink && (
          <div className="text-xs text-blue-300">🥤 {item.setMealChoices.drink}</div>
        )}
        {item.setMealChoices?.upgradeDetails && item.setMealChoices.upgradeDetails.length > 0 && (
          <div className="text-xs text-orange-300 font-semibold">⬆️ {item.setMealChoices.upgradeDetails.join(', ')}</div>
        )}
      </div>
    )
  }

  // ─── Order card ──────────────────────────────────────────────────────────
  const OrderCard = ({
    order,
    variant,
  }: {
    order: TableOrder
    variant: 'pending' | 'preparing'
  }) => {
    const isSelected = selectedOrder === order.id
    const borderColor = isSelected
      ? 'border-yellow-500 shadow-2xl shadow-yellow-500/50'
      : variant === 'pending'
        ? 'border-red-700/60 hover:border-red-500'
        : 'border-blue-700/60 hover:border-blue-500'

    return (
      <div
        onClick={() => setSelectedOrder(order.id)}
        className={`bg-gray-800 rounded-xl p-5 cursor-pointer transition-all border-4 ${borderColor}`}
      >
        {/* Card header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className={`text-4xl font-black ${variant === 'pending' ? 'text-yellow-500' : 'text-orange-500'}`}>
              T{order.table_number}
            </div>
            {order.customer_name && (
              <div className="text-sm text-gray-300 mt-0.5">
                {order.customer_name}{order.party_size ? ` · ${order.party_size} pax` : ''}
              </div>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-sm text-gray-400">{new Date(order.created_at).toLocaleTimeString('ja-JP')}</div>
            {order.is_addon && (
              <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded font-bold">ADD-ON</span>
            )}
            {isSelected && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">SELECTED</span>
            )}
          </div>
        </div>

        {/* Items with sub-items */}
        <div className="space-y-2 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="bg-gray-700/60 rounded-lg px-3 py-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-white">
                  {item.name}{item.variation ? ` (${item.variation})` : ''}
                </span>
                <span className="text-xl font-black text-orange-500 ml-2 flex-shrink-0">×{item.quantity}</span>
              </div>
              <SubItems item={item} />
            </div>
          ))}
        </div>

        <div className="text-xl font-bold text-center mb-4 text-green-400">{formatPrice(order.total_amount)}</div>

        {/* Action buttons */}
        <div className="space-y-2">
          {variant === 'pending' ? (
            <button
              onClick={(e) => { e.stopPropagation(); markAsPreparing(order.id) }}
              className="w-full bg-orange-600 hover:bg-orange-700 font-bold py-2.5 rounded-lg transition-all text-white"
            >
              👨‍🍳 Start Preparing →
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); completeOrder(order.id) }}
              className="w-full bg-green-600 hover:bg-green-700 font-bold py-2.5 rounded-lg transition-all text-white"
            >
              ✓ Mark Complete
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); printKitchenSlip(order) }}
              className="bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1 text-white"
            >
              🖨️ Kitchen Slip
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); printBill(order) }}
              className="bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1 text-white"
            >
              🧾 Customer Bill
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Kitchen Display...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" onClick={handleEnableAudio}>

      {/* Header */}
      <div className="bg-gray-800 border-b-4 border-orange-500 py-4">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold">Kitchen Display</h1>
                <p className="text-gray-400 text-sm">The Curry House Yokosuka</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${audioEnabled ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}>
                {audioEnabled ? '🔊 SOUND ON' : '🔇 CLICK FOR SOUND'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-orange-500">{orders.length}</div>
              <div className="text-gray-400 text-sm">Active Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tip bar */}
      <div className="bg-blue-900/50 border-b border-blue-700 py-2">
        <div className="container-custom">
          <p className="text-center text-blue-200 text-sm">
            📝 Click an order to select · Press <strong>ENTER</strong> to print kitchen slip · Use card buttons to print
          </p>
        </div>
      </div>

      <div className="container-custom py-6">

        {/* ── NEW / PENDING ─────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="bg-red-600 px-3 py-1 rounded-lg text-base">🔴 NEW</span>
            <span>Pending Orders ({pendingOrders.length})</span>
          </h2>
          {pendingOrders.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              No pending orders
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} variant="pending" />
              ))}
            </div>
          )}
        </div>

        {/* ── PREPARING ─────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="bg-orange-600 px-3 py-1 rounded-lg text-base">👨‍🍳 PREPARING</span>
            <span>In Progress ({preparingOrders.length})</span>
          </h2>
          {preparingOrders.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              No orders being prepared
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preparingOrders.map(order => (
                <OrderCard key={order.id} order={order} variant="preparing" />
              ))}
            </div>
          )}
        </div>

        {/* ── COMPLETED TODAY (dimmed) ───────────────────── */}
        {completedOrders.length > 0 && (
          <div className="opacity-40 hover:opacity-60 transition-opacity">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span className="bg-gray-600 px-3 py-1 rounded-lg text-base">✅ DONE</span>
              <span>Completed Today ({completedOrders.length})</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {completedOrders.map(order => (
                <div key={order.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-black text-gray-400">T{order.table_number}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('ja-JP')}</div>
                  </div>
                  {order.customer_name && (
                    <div className="text-xs text-gray-500 mb-2">{order.customer_name}</div>
                  )}
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="text-sm text-gray-500 flex justify-between">
                        <span>{item.name}{item.variation ? ` (${item.variation})` : ''}</span>
                        <span>×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-gray-500 font-bold text-sm mb-2">
                    {formatPrice(order.total_amount)}
                  </div>
                  <button
                    onClick={() => printBill(order)}
                    className="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-all"
                  >
                    🧾 Reprint Bill
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

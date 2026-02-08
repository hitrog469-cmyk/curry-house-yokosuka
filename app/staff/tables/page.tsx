'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface TableSession {
  id: string
  table_number: number
  session_token: string
  customer_name: string
  party_size: number
  status: 'active' | 'ordering' | 'bill_requested' | 'paid' | 'released'
  total_amount: number
  orders: any[]
  created_at: string
  updated_at: string
  released_at: string | null
  released_by: string | null
}

export default function StaffTablesPage() {
  const [sessions, setSessions] = useState<TableSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null)
  const [staffName, setStaffName] = useState('')
  const [releasing, setReleasing] = useState(false)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchSessions()

    if (!supabase) return
    // Real-time subscription
    const channel = supabase
      .channel('table_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, () => {
        fetchSessions()
      })
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [])

  const fetchSessions = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('table_sessions')
        .select('*')
        .in('status', ['active', 'ordering', 'bill_requested'])
        .order('table_number', { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseTable = async (session: TableSession) => {
    if (!staffName.trim()) {
      alert('Please enter your name to release the table')
      return
    }

    if (!supabase) return
    setReleasing(true)
    try {
      const { error } = await supabase
        .from('table_sessions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_by: staffName
        })
        .eq('id', session.id)

      if (error) throw error

      // Clear localStorage for this table (if staff is using same browser)
      localStorage.removeItem(`table_session_${session.table_number}`)

      setSelectedSession(null)
      fetchSessions()
    } catch (error) {
      console.error('Error releasing table:', error)
      alert('Failed to release table. Please try again.')
    } finally {
      setReleasing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">Active</span>
      case 'ordering':
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">Ordering</span>
      case 'bill_requested':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">Bill Requested</span>
      default:
        return <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>
    }
  }

  const getTableNumbers = () => {
    const occupiedTables = new Set(sessions.map(s => s.table_number))
    return Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      occupied: occupiedTables.has(i + 1),
      session: sessions.find(s => s.table_number === i + 1)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500">Loading tables...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-stone-900 text-white">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Table Management</h1>
              <p className="text-stone-400 text-sm">Staff Control Panel</p>
            </div>
            <Link href="/staff" className="bg-stone-800 hover:bg-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {/* Staff Name Input */}
      <div className="bg-white border-b">
        <div className="container-custom py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-stone-600">Staff Name:</span>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Enter your name"
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="container-custom py-6">
        <h2 className="text-lg font-bold text-stone-800 mb-4">All Tables</h2>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {getTableNumbers().map(table => (
            <button
              key={table.number}
              onClick={() => table.session && setSelectedSession(table.session)}
              disabled={!table.occupied}
              className={`relative p-4 rounded-xl font-bold transition-all ${
                table.occupied
                  ? table.session?.status === 'bill_requested'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
                  : 'bg-white text-stone-400 border-2 border-dashed border-stone-200 cursor-default'
              }`}
            >
              <span className="text-2xl">{table.number}</span>
              {table.occupied && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    table.session?.status === 'bill_requested' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Active Sessions List */}
        <h2 className="text-lg font-bold text-stone-800 mb-4">Active Sessions ({sessions.length})</h2>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
            <div className="text-4xl mb-3">🪑</div>
            <p className="text-stone-500 font-medium">No active table sessions</p>
            <p className="text-stone-400 text-sm mt-1">Tables will appear here when customers scan QR codes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`bg-white rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md ${
                  session.status === 'bill_requested'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                      session.status === 'bill_requested'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {session.table_number}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{session.customer_name}</p>
                      <p className="text-stone-500 text-sm">{session.party_size} {session.party_size === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(session.status)}
                    <p className="text-emerald-600 font-bold mt-1">{formatPrice(session.total_amount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>{session.orders?.length || 0} order(s)</span>
                  <span>Started {new Date(session.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSession(null)}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-5 ${
              selectedSession.status === 'bill_requested'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-black text-2xl">
                    {selectedSession.table_number}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedSession.customer_name}</h3>
                    <p className="text-white/80 text-sm">{selectedSession.party_size} {selectedSession.party_size === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[50vh]">
              {/* Status */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-200">
                <span className="text-stone-500">Status</span>
                {getStatusBadge(selectedSession.status)}
              </div>

              {/* Orders */}
              <h4 className="font-bold text-stone-800 mb-3">Orders</h4>
              {selectedSession.orders && selectedSession.orders.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {selectedSession.orders.map((order: any, idx: number) => (
                    <div key={idx} className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                      <p className="text-xs text-stone-400 mb-2 font-medium">Order #{order.order_number}</p>
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm py-0.5">
                          <span className="text-stone-600">
                            {item.name} x{item.quantity}
                            {item.spiceLevel && <span className="text-xs text-orange-500 ml-1">({item.spiceLevel})</span>}
                          </span>
                          <span className="text-stone-800 font-medium">{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 mt-2 border-t border-stone-200">
                        <span className="font-medium text-stone-600">Order Total</span>
                        <span className="font-bold text-emerald-600">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-sm mb-4">No orders yet</p>
              )}

              {/* Total */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-800">Session Total</span>
                  <span className="text-2xl font-black text-emerald-600">{formatPrice(selectedSession.total_amount)}</span>
                </div>
              </div>

              {/* Session Info */}
              <div className="mt-4 text-xs text-stone-400 space-y-1">
                <p>Started: {new Date(selectedSession.created_at).toLocaleString()}</p>
                <p>Last Update: {new Date(selectedSession.updated_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-stone-200 bg-stone-50">
              {selectedSession.status === 'bill_requested' && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mb-4">
                  <p className="text-amber-700 text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🧾</span>
                    Customer is waiting for the bill!
                  </p>
                </div>
              )}

              <button
                onClick={() => handleReleaseTable(selectedSession)}
                disabled={releasing || !staffName.trim()}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {releasing ? 'Releasing...' : 'Payment Complete — Release Table'}
              </button>

              {!staffName.trim() && (
                <p className="text-xs text-red-500 text-center mt-2">Please enter your name at the top to release tables</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

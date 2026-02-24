'use client'
import { useState, useEffect, useCallback } from 'react'

type CateringInquiry = {
  id: string
  name: string
  email: string
  phone: string
  event_type: string
  guest_count: number
  event_date: string
  event_time: string
  special_requirements: string | null
  status: 'pending' | 'contacted' | 'confirmed' | 'cancelled'
  created_at: string
}

const STATUS_META: Record<string, { color: string; label: string; border: string }> = {
  pending:   { color: 'bg-yellow-100 text-yellow-800', label: '⏳ Pending',   border: 'border-yellow-400' },
  contacted: { color: 'bg-blue-100 text-blue-800',     label: '📞 Contacted', border: 'border-blue-400' },
  confirmed: { color: 'bg-green-100 text-green-800',   label: '✅ Confirmed', border: 'border-green-500' },
  cancelled: { color: 'bg-red-100 text-red-700',       label: '❌ Cancelled', border: 'border-red-300' },
}

export default function AdminCateringView() {
  const [inquiries, setInquiries] = useState<CateringInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    const url = filterStatus !== 'all' ? `/api/catering?status=${filterStatus}` : '/api/catering'
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      setInquiries(json.inquiries || [])
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchInquiries() }, [fetchInquiries])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const res = await fetch('/api/catering', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      showToast(`Marked as ${status}`)
      fetchInquiries()
    }
    setUpdating(null)
  }

  // Stats
  const pendingCount = inquiries.filter(i => i.status === 'pending').length
  const upcomingConfirmed = inquiries.filter(i =>
    i.status === 'confirmed' && new Date(i.event_date) >= new Date()
  ).length

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key}
            className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${meta.border} cursor-pointer hover:shadow-md transition-all ${filterStatus === key ? 'ring-2 ring-gray-900' : ''}`}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
          >
            <p className="text-xs font-bold text-gray-500 mb-1">{meta.label}</p>
            <p className="text-3xl font-black text-gray-900">{inquiries.filter(i => i.status === key).length}</p>
          </div>
        ))}
      </div>

      {/* Alert for pending */}
      {pendingCount > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="font-bold text-yellow-800">{pendingCount} inquiry{pendingCount > 1 ? 's' : ''} waiting for response</p>
            <p className="text-sm text-yellow-700">Please contact them to discuss event details</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 flex-wrap">
          <button onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            All ({inquiries.length})
          </button>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {meta.label} ({inquiries.filter(i => i.status === key).length})
            </button>
          ))}
        </div>
        <button onClick={fetchInquiries} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
        {upcomingConfirmed > 0 && (
          <span className="ml-auto bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            🎉 {upcomingConfirmed} upcoming confirmed event{upcomingConfirmed > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-500">No catering inquiries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map(inq => {
            const meta = STATUS_META[inq.status]
            const isExpanded = expanded === inq.id
            const eventDate = new Date(inq.event_date)
            const isPast = eventDate < new Date()
            return (
              <div key={inq.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${meta.border} ${isPast && inq.status === 'confirmed' ? 'opacity-70' : ''}`}
              >
                <button
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : inq.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                      🎉
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{inq.name}</p>
                      <p className="text-xs text-gray-500">{inq.email} · {inq.phone}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">{inq.event_type}</p>
                      <p className="text-xs text-gray-500">{inq.guest_count} guests</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">
                        {eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">{inq.event_time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.color}`}>{meta.label}</span>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Details table */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Event Details</p>
                        {[
                          ['Event Type', inq.event_type],
                          ['Guest Count', `${inq.guest_count} people`],
                          ['Date', eventDate.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })],
                          ['Time', inq.event_time],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{label}</span>
                            <span className="font-bold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Contact</p>
                        {[
                          ['Name', inq.name],
                          ['Email', inq.email],
                          ['Phone', inq.phone],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{label}</span>
                            <span className="font-bold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {inq.special_requirements && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 uppercase mb-1">Special Requirements</p>
                        <p className="text-sm text-gray-800">{inq.special_requirements}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold text-gray-500">Status:</span>
                      {Object.entries(STATUS_META).map(([key, smeta]) => (
                        <button key={key}
                          disabled={updating === inq.id || inq.status === key}
                          onClick={() => updateStatus(inq.id, key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${
                            inq.status === key ? `${smeta.color} cursor-default` : 'bg-gray-900 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {smeta.label}
                        </button>
                      ))}
                      <a
                        href={`mailto:${inq.email}?subject=Catering Inquiry — The Curry House Yokosuka&body=Hi ${inq.name},%0A%0AThank you for your catering inquiry for ${inq.event_type} on ${eventDate.toLocaleDateString('en-GB')}.%0A%0A`}
                        onClick={() => inq.status === 'pending' && updateStatus(inq.id, 'contacted')}
                        className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        📧 Reply to Client
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

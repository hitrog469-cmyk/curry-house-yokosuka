'use client'
import { useState, useEffect, useCallback } from 'react'

type ContactMessage = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  created_at: string
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  new:      { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '🔴 New' },
  read:     { color: 'bg-blue-100 text-blue-800 border-blue-300',   label: '👁 Read' },
  replied:  { color: 'bg-green-100 text-green-800 border-green-300', label: '✅ Replied' },
  archived: { color: 'bg-gray-100 text-gray-600 border-gray-300',   label: '📦 Archived' },
}

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry', reservation: 'Reservation',
  order: 'Order Question', feedback: 'Feedback',
  catering: 'Catering Request', careers: 'Careers', other: 'Other',
}

export default function AdminContactView() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const url = filterStatus !== 'all' ? `/api/contact?status=${filterStatus}` : '/api/contact'
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      setMessages(json.messages || [])
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const res = await fetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      showToast(`Marked as ${status}`)
      fetchMessages()
    }
    setUpdating(null)
  }

  const newCount = messages.filter(m => m.status === 'new').length

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
            className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all ${filterStatus === key ? 'ring-2 ring-gray-900' : ''} ${key === 'new' ? 'border-yellow-400' : key === 'replied' ? 'border-green-500' : key === 'read' ? 'border-blue-400' : 'border-gray-300'}`}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
          >
            <p className="text-xs font-bold text-gray-500 mb-1">{meta.label}</p>
            <p className="text-3xl font-black text-gray-900">{messages.filter(m => m.status === key).length}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1">
          {['all', 'new', 'read', 'replied', 'archived'].map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {s === 'all' ? `All (${messages.length})` : `${STATUS_META[s]?.label} (${messages.filter(m => m.status === s).length})`}
            </button>
          ))}
        </div>
        <button onClick={fetchMessages} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
        {newCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {newCount} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => {
            const isNew = m.status === 'new'
            const isExpanded = expanded === m.id
            const meta = STATUS_META[m.status]
            return (
              <div key={m.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${isNew ? 'border-yellow-400 ring-1 ring-yellow-100' : 'border-gray-200'}`}
              >
                <button
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setExpanded(isExpanded ? null : m.id)
                    if (m.status === 'new') updateStatus(m.id, 'read')
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.color}`}>{meta.label}</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      {SUBJECT_LABELS[m.subject] || m.subject}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString('ja-JP')}</span>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Message</p>
                      <p className="text-gray-800 text-sm whitespace-pre-line">{m.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold text-gray-500">Mark as:</span>
                      {(['read', 'replied', 'archived'] as const).map(s => (
                        <button key={s}
                          disabled={updating === m.id || m.status === s}
                          onClick={() => updateStatus(m.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${
                            m.status === s ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-gray-900 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {STATUS_META[s].label}
                        </button>
                      ))}
                      <a
                        href={`mailto:${m.email}?subject=Re: ${SUBJECT_LABELS[m.subject] || m.subject}&body=Hi ${m.name},%0A%0A`}
                        onClick={() => updateStatus(m.id, 'replied')}
                        className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        📧 Reply via Email
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

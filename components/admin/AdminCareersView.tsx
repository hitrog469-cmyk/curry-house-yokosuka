'use client'
import { useState, useEffect, useCallback } from 'react'
import { Circle, Eye, Star, XCircle, CheckCircle, Briefcase, Paperclip, Save, Mail, type LucideIcon } from 'lucide-react'

type Application = {
  id: string
  name: string
  email: string
  phone: string
  position: string
  cover_letter: string
  cv_url: string | null
  cv_filename: string | null
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  notes: string | null
  created_at: string
}

const STATUS_META: Record<string, { color: string; label: string; border: string; icon: LucideIcon }> = {
  new:         { color: 'bg-yellow-100 text-yellow-800', label: 'New',         border: 'border-yellow-400', icon: Circle },
  reviewed:    { color: 'bg-blue-100 text-blue-800',     label: 'Reviewed',    border: 'border-blue-400',   icon: Eye },
  shortlisted: { color: 'bg-purple-100 text-purple-800', label: 'Shortlisted', border: 'border-purple-400', icon: Star },
  rejected:    { color: 'bg-red-100 text-red-700',       label: 'Rejected',    border: 'border-red-300',    icon: XCircle },
  hired:       { color: 'bg-green-100 text-green-800',   label: 'Hired',       border: 'border-green-500',  icon: CheckCircle },
}

export default function AdminCareersView() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchApps = useCallback(async () => {
    setLoading(true)
    const url = filterStatus !== 'all' ? `/api/careers?status=${filterStatus}` : '/api/careers'
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      setApps(json.applications || [])
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchApps() }, [fetchApps])

  async function updateApp(id: string, updates: { status?: string; notes?: string }) {
    setSaving(id)
    const res = await fetch('/api/careers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) {
      showToast('Updated!')
      fetchApps()
    }
    setSaving(null)
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const StatIcon = meta.icon
          return (
          <div key={key}
            className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${meta.border} cursor-pointer hover:shadow-md transition-all ${filterStatus === key ? 'ring-2 ring-gray-900' : ''}`}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
          >
            <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><StatIcon className="w-3.5 h-3.5" /> {meta.label}</p>
            <p className="text-3xl font-black text-gray-900">{apps.filter(a => a.status === key).length}</p>
          </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 flex-wrap">
          <button onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            All ({apps.length})
          </button>
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const FilterIcon = meta.icon
            return (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${filterStatus === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <FilterIcon className="w-3.5 h-3.5" /> {meta.label} ({apps.filter(a => a.status === key).length})
            </button>
            )
          })}
        </div>
        <button onClick={fetchApps} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(a => {
            const meta = STATUS_META[a.status]
            const MetaIcon = meta.icon
            const isExpanded = expanded === a.id
            return (
              <div key={a.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${meta.border}`}
              >
                <button
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : a.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.email} · {a.phone}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">{a.position}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${meta.color}`}><MetaIcon className="w-3.5 h-3.5" /> {meta.label}</span>
                    {a.cv_url && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" /> CV</span>
                    )}
                    <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('ja-JP')}</span>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Cover letter */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cover Letter</p>
                      <p className="text-gray-800 text-sm whitespace-pre-line">{a.cover_letter}</p>
                    </div>

                    {/* CV download */}
                    {a.cv_url && (
                      <div className="flex items-center gap-3">
                        <a
                          href={a.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2"
                        >
                          <Paperclip className="w-4 h-4" /> Download CV {a.cv_filename ? `(${a.cv_filename})` : ''}
                        </a>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Internal Notes</label>
                      <textarea
                        rows={2}
                        value={editNotes[a.id] ?? (a.notes || '')}
                        onChange={e => setEditNotes(n => ({ ...n, [a.id]: e.target.value }))}
                        placeholder="Add notes about this candidate…"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold text-gray-500">Status:</span>
                      {Object.entries(STATUS_META).map(([key, smeta]) => {
                        const BtnIcon = smeta.icon
                        return (
                        <button key={key}
                          disabled={saving === a.id || a.status === key}
                          onClick={() => updateApp(a.id, { status: key, notes: editNotes[a.id] ?? a.notes ?? undefined })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 inline-flex items-center gap-1 ${
                            a.status === key ? `${smeta.color} cursor-default` : 'bg-gray-900 hover:bg-gray-700 text-white'
                          }`}
                        >
                          <BtnIcon className="w-3.5 h-3.5" /> {smeta.label}
                        </button>
                        )
                      })}
                      {editNotes[a.id] !== undefined && editNotes[a.id] !== (a.notes || '') && (
                        <button
                          disabled={saving === a.id}
                          onClick={() => updateApp(a.id, { notes: editNotes[a.id] })}
                          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          {saving === a.id ? 'Saving…' : <><Save className="w-3.5 h-3.5" /> Save Notes</>}
                        </button>
                      )}
                      <a
                        href={`mailto:${a.email}?subject=Re: Your application for ${a.position} at The Curry House Yokosuka&body=Hi ${a.name},%0A%0A`}
                        className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email Applicant
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

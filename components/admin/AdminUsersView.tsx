'use client'
import { useState, useEffect, useCallback } from 'react'
import { Crown, Car, Bell, ChefHat, HandHelping, HelpCircle, Search, User, Pencil, Ban, CheckCircle, XCircle, Link2, MapPin, type LucideIcon } from 'lucide-react'

type UserProfile = {
  id: string
  email: string
  full_name: string
  role: string
  phone: string | null
  is_active: boolean
  created_at: string
}

const ROLES = ['admin', 'staff', 'reception', 'kitchen', 'customer'] as const
type Role = (typeof ROLES)[number]

const ROLE_META: Record<Role, { label: string; color: string; icon: LucideIcon; loginUrl: string; dashUrl: string }> = {
  admin:     { label: 'Admin',     color: 'bg-red-100 text-red-800 border-red-300',       icon: Crown,       loginUrl: '/admin/login',  dashUrl: '/admin' },
  staff:     { label: 'Staff',     color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Car,         loginUrl: '/admin/login',  dashUrl: '/staff' },
  reception: { label: 'Reception', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Bell,        loginUrl: '/admin/login',  dashUrl: '/reception' },
  kitchen:   { label: 'Kitchen',   color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: ChefHat,     loginUrl: '/admin/login',  dashUrl: '/kitchen' },
  customer:  { label: 'Customer',  color: 'bg-blue-100 text-blue-800 border-blue-300',     icon: HandHelping, loginUrl: '/auth/login',   dashUrl: '/profile' },
}

const BLANK_FORM = { email: '', password: '', fullName: '', phone: '', role: 'staff' as Role }

export default function AdminUsersView() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit role / reset password inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Role>('staff')
  const [editPassword, setEditPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const json = await res.json()
      setUsers(json.users || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filteredUsers = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  // ── Create user ──────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setCreateError(json.error || 'Failed to create user')
    } else {
      setShowCreate(false)
      setForm(BLANK_FORM)
      showToast(`Created ${json.user.email} as ${json.user.role}`)
      fetchUsers()
    }
    setCreating(false)
  }

  // ── Save role / password ─────────────────────────────────────────────────
  async function handleSave(id: string) {
    setSaving(true)
    const body: Record<string, any> = { id, role: editRole }
    if (editPassword.trim()) body.password = editPassword.trim()

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) {
      showToast(`${json.error}`)
    } else {
      showToast(`Updated ${json.user.email}`)
      setEditingId(null)
      setEditPassword('')
      fetchUsers()
    }
    setSaving(false)
  }

  // ── Toggle active ────────────────────────────────────────────────────────
  async function toggleActive(u: UserProfile) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, is_active: !u.is_active }),
    })
    if (res.ok) {
      showToast(`${!u.is_active ? 'Activated' : 'Deactivated'}: ${u.email}`)
      fetchUsers()
    }
  }

  const roleCountFor = (role: string) => users.filter(u => u.role === role).length

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}

      {/* Role overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ROLES.map(role => {
          const m = ROLE_META[role]
          const Icon = m.icon
          return (
            <div key={role} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer transition-all hover:shadow-md ${filterRole === role ? 'ring-2 ring-gray-900' : ''}`}
              onClick={() => setFilterRole(filterRole === role ? 'all' : role)}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-bold text-gray-500 uppercase">{role}</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{roleCountFor(role)}</p>
              <p className="text-xs text-gray-400 mt-1">{m.dashUrl}</p>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold"
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
        </select>
        <button
          onClick={() => { setShowCreate(true); setCreateError('') }}
          className="bg-gray-900 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Create User
        </button>
        <button onClick={fetchUsers} className="text-sm text-blue-600 hover:underline px-2">↻ Refresh</button>
      </div>

      {/* User table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
          <p className="mt-3 text-gray-500">Loading users…</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map(u => {
            const meta = ROLE_META[u.role as Role] || { label: u.role, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: HelpCircle }
            const MetaIcon = meta.icon
            const isEditing = editingId === u.id
            return (
              <div key={u.id} className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${!u.is_active ? 'opacity-50' : ''}`}>
                {/* Main row */}
                <div className="flex flex-wrap items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color.split(' ')[0]}`}>
                    <MetaIcon className="w-5 h-5 text-gray-700" />
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{u.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                  </div>

                  {/* Role badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${meta.color}`}>
                    <MetaIcon className="w-3.5 h-3.5" /> {u.role}
                  </span>

                  {/* Status */}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? '● Active' : '○ Inactive'}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-gray-400 hidden md:block">
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (isEditing) { setEditingId(null); setEditPassword('') }
                        else { setEditingId(u.id); setEditRole(u.role as Role); setEditPassword('') }
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      {isEditing ? 'Cancel' : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 ${
                        u.is_active
                          ? 'bg-red-50 hover:bg-red-100 text-red-600'
                          : 'bg-green-50 hover:bg-green-100 text-green-600'
                      }`}
                    >
                      {u.is_active ? <><Ban className="w-3.5 h-3.5" /> Deactivate</> : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">ROLE</label>
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value as Role)}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-semibold bg-white"
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">NEW PASSWORD (optional)</label>
                        <input
                          type="password"
                          placeholder="Leave blank to keep current"
                          value={editPassword}
                          onChange={e => setEditPassword(e.target.value)}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => handleSave(u.id)}
                        disabled={saving}
                        className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors"
                      >
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>

                    {/* Login info for this role */}
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600">
                      <span className="font-bold">Login URL:</span>{' '}
                      <code className="bg-gray-100 px-1 rounded">{meta.loginUrl}</code>
                      {'  '}
                      <span className="font-bold ml-3">Dashboard:</span>{' '}
                      <code className="bg-gray-100 px-1 rounded">{meta.dashUrl}</code>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">Create New User</h2>
              <p className="text-sm text-gray-500 mt-1">Add staff, admin, reception, or kitchen account</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">ROLE *</label>
                <div className="grid grid-cols-5 gap-2">
                  {ROLES.map(r => {
                    const RoleIcon = ROLE_META[r].icon
                    return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        form.role === r
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <RoleIcon className="w-5 h-5 mx-auto" />
                      <div className="text-xs font-bold mt-0.5 capitalize">{r}</div>
                    </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">FULL NAME *</label>
                  <input
                    required
                    type="text"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="e.g. Tanaka Yuki"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">EMAIL *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">PASSWORD *</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">PHONE</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="080-0000-0000"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Login info preview */}
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-200">
                <p className="font-bold text-gray-700 mb-1">This user will log in at:</p>
                <p className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 flex-shrink-0" /> <code className="bg-white px-1 rounded border">{ROLE_META[form.role].loginUrl}</code></p>
                <p className="mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> Dashboard: <code className="bg-white px-1 rounded border">{ROLE_META[form.role].dashUrl}</code></p>
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm(BLANK_FORM); setCreateError('') }}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  {creating ? 'Creating…' : `Create ${form.role}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

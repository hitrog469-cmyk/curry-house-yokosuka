'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { menuItems } from '@/lib/menu-data'
import {
  createDailySpecial,
  getAllDailySpecials,
  deactivateDailySpecial,
  deleteDailySpecial,
  type DailySpecial
} from '@/lib/daily-special-api'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminContentPage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Auth — refresh session on mount so role changes (e.g. customer→admin) take effect
  const [refreshing, setRefreshing] = useState(true)
  useEffect(() => {
    refreshUser().finally(() => setRefreshing(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect only after BOTH auth and refresh are done
  useEffect(() => {
    if (!authLoading && !refreshing && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, refreshing, router])

  const isAuthed = user?.role === 'admin'

  // ── Daily Special ──────────────────────────────────────
  const [specials, setSpecials] = useState<DailySpecial[]>([])
  const [specialForm, setSpecialForm] = useState({
    menu_item_id: '',
    menu_item_name: '',
    original_price: '',
    special_price: '',
    display_text: '',
    valid_from: '11:00',
    valid_until: '22:00',
  })
  const [savingSpecial, setSavingSpecial] = useState(false)

  const loadSpecials = useCallback(async () => {
    const data = await getAllDailySpecials()
    setSpecials(data)
  }, [])

  const handleMenuItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = menuItems.find(m => m.id === e.target.value)
    if (!item) { setSpecialForm(f => ({ ...f, menu_item_id: '', menu_item_name: '', original_price: '' })); return }
    setSpecialForm(f => ({
      ...f,
      menu_item_id: item.id,
      menu_item_name: item.name,
      original_price: String(item.price),
    }))
  }

  const handleSaveSpecial = async () => {
    if (!specialForm.menu_item_id || !specialForm.special_price) {
      toast.error('Please select a menu item and set the special price.')
      return
    }
    setSavingSpecial(true)
    const result = await createDailySpecial({
      menu_item_id: specialForm.menu_item_id,
      menu_item_name: specialForm.menu_item_name,
      original_price: Number(specialForm.original_price),
      special_price: Number(specialForm.special_price),
      display_text: specialForm.display_text || `Today's Special: ${specialForm.menu_item_name}`,
      valid_from: specialForm.valid_from,
      valid_until: specialForm.valid_until,
    })
    setSavingSpecial(false)
    if (result.success) {
      toast.success("Today's special saved!")
      setSpecialForm({ menu_item_id: '', menu_item_name: '', original_price: '', special_price: '', display_text: '', valid_from: '11:00', valid_until: '22:00' })
      loadSpecials()
    } else {
      toast.error(result.error || 'Failed to save special.')
    }
  }

  // ── Banner Messages ────────────────────────────────────
  const [bannerMessages, setBannerMessages] = useState<string[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [savingBanner, setSavingBanner] = useState(false)

  const loadBannerMessages = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'banner_messages')
      .single()
    if (data?.value) setBannerMessages(data.value as string[])
  }, [supabase])

  const saveBannerMessages = async (msgs: string[]) => {
    if (!supabase) return
    setSavingBanner(true)
    await supabase
      .from('site_settings')
      .upsert({ key: 'banner_messages', value: msgs, updated_at: new Date().toISOString() })
    setSavingBanner(false)
    toast.success('Banner messages saved!')
  }

  const handleAddMessage = () => {
    if (!newMessage.trim()) return
    const updated = [...bannerMessages, newMessage.trim()]
    setBannerMessages(updated)
    setNewMessage('')
    saveBannerMessages(updated)
  }

  const handleRemoveMessage = (idx: number) => {
    const updated = bannerMessages.filter((_, i) => i !== idx)
    setBannerMessages(updated)
    saveBannerMessages(updated)
  }

  const handleMessageEdit = (idx: number, val: string) => {
    const updated = bannerMessages.map((m, i) => (i === idx ? val : m))
    setBannerMessages(updated)
  }

  // ── Restaurant Status ──────────────────────────────────
  const [restaurantOpen, setRestaurantOpen] = useState(true)
  const [closedMessage, setClosedMessage] = useState('We are currently closed. We will be back soon!')
  const [savingStatus, setSavingStatus] = useState(false)

  const loadRestaurantStatus = useCallback(async () => {
    if (!supabase) return
    const { data: openData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'restaurant_open')
      .single()
    if (openData) setRestaurantOpen(openData.value as boolean)

    const { data: msgData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'restaurant_closed_message')
      .single()
    if (msgData) setClosedMessage(msgData.value as string)
  }, [supabase])

  const saveRestaurantStatus = async () => {
    if (!supabase) return
    setSavingStatus(true)
    await supabase.from('site_settings').upsert([
      { key: 'restaurant_open', value: restaurantOpen, updated_at: new Date().toISOString() },
      { key: 'restaurant_closed_message', value: closedMessage, updated_at: new Date().toISOString() },
    ])
    setSavingStatus(false)
    toast.success('Restaurant status saved!')
  }

  // Load all on mount
  useEffect(() => {
    if (!isAuthed) return
    loadSpecials()
    loadBannerMessages()
    loadRestaurantStatus()
  }, [isAuthed, loadSpecials, loadBannerMessages, loadRestaurantStatus])

  // Show loading screen while auth or session refresh is in progress
  if (authLoading || refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Verifying access...</p>
        </div>
      </div>
    )
  }
  if (!isAuthed) return null

  const japanDate = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric' })
  const todaySpecials = specials.filter(s => s.valid_date === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            ← Back to Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Content Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{japanDate}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Restaurant Status ── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">🏪 Restaurant Status</h2>
            <p className="text-green-100 text-sm">Control whether the restaurant appears open or closed to customers</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRestaurantOpen(true)}
                className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 transition-all ${restaurantOpen ? 'bg-green-500 text-white border-green-500 shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-green-400'}`}
              >
                ✅ OPEN
              </button>
              <button
                onClick={() => setRestaurantOpen(false)}
                className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 transition-all ${!restaurantOpen ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-400'}`}
              >
                🔴 CLOSED
              </button>
            </div>
            {!restaurantOpen && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Closed Message (shown to customers)</label>
                <input
                  type="text"
                  value={closedMessage}
                  onChange={e => setClosedMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="We are currently closed..."
                />
              </div>
            )}
            <button
              onClick={saveRestaurantStatus}
              disabled={savingStatus}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60"
            >
              {savingStatus ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </section>

        {/* ── Today's Special ── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">⭐ Today's Special</h2>
            <p className="text-orange-100 text-sm">Set a discounted item to feature on the menu today</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Today's Active Specials */}
            {todaySpecials.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Active today:</p>
                {todaySpecials.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${s.is_active ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-700/50 opacity-60'}`}>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{s.menu_item_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="line-through">{formatPrice(s.original_price)}</span>
                        {' → '}
                        <span className="text-green-600 font-bold">{formatPrice(s.special_price)}</span>
                        {' · '}
                        {s.discount_percentage}% OFF
                        {' · '}
                        {s.valid_from}–{s.valid_until}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {s.is_active && (
                        <button
                          onClick={async () => { await deactivateDailySpecial(s.id); loadSpecials(); toast.success('Special deactivated') }}
                          className="px-3 py-1.5 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-semibold transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={async () => { await deleteDailySpecial(s.id); loadSpecials(); toast.success('Special deleted') }}
                        className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Special Form */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 space-y-4 border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Set New Special</p>

              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Menu Item</label>
                <select
                  value={specialForm.menu_item_id}
                  onChange={handleMenuItemSelect}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">— Select item —</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {formatPrice(item.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Original Price (¥)</label>
                  <input
                    type="number"
                    value={specialForm.original_price}
                    onChange={e => setSpecialForm(f => ({ ...f, original_price: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Special Price (¥)</label>
                  <input
                    type="number"
                    value={specialForm.special_price}
                    onChange={e => setSpecialForm(f => ({ ...f, special_price: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="900"
                  />
                </div>
              </div>

              {specialForm.original_price && specialForm.special_price && Number(specialForm.special_price) < Number(specialForm.original_price) && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                  <span>✓</span>
                  <span>
                    {Math.round(((Number(specialForm.original_price) - Number(specialForm.special_price)) / Number(specialForm.original_price)) * 100)}% discount
                    · Customer saves {formatPrice(Number(specialForm.original_price) - Number(specialForm.special_price))}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Valid From</label>
                  <input
                    type="time"
                    value={specialForm.valid_from}
                    onChange={e => setSpecialForm(f => ({ ...f, valid_from: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Valid Until</label>
                  <input
                    type="time"
                    value={specialForm.valid_until}
                    onChange={e => setSpecialForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Display Text (optional)</label>
                <input
                  type="text"
                  value={specialForm.display_text}
                  onChange={e => setSpecialForm(f => ({ ...f, display_text: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder={`Today's Special: ${specialForm.menu_item_name || 'Item Name'}`}
                />
              </div>

              <button
                onClick={handleSaveSpecial}
                disabled={savingSpecial}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60"
              >
                {savingSpecial ? 'Saving...' : '⭐ Activate Today\'s Special'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Banner Messages ── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">📢 Banner Messages</h2>
            <p className="text-red-100 text-sm">Edit the scrolling messages shown at the top of every page</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Current Messages */}
            <div className="space-y-2">
              {bannerMessages.map((msg, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={msg}
                    onChange={e => handleMessageEdit(idx, e.target.value)}
                    onBlur={() => saveBannerMessages(bannerMessages)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleRemoveMessage(idx)}
                    className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add New */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMessage()}
                className="flex-1 px-4 py-2.5 border border-dashed border-gray-400 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-solid"
                placeholder="🎉 Add a new banner message..."
              />
              <button
                onClick={handleAddMessage}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            {savingBanner && <p className="text-sm text-gray-400 dark:text-gray-500">Saving...</p>}

            {/* Preview */}
            <div className="mt-2 p-3 bg-red-600 rounded-xl overflow-hidden">
              <p className="text-xs text-red-200 mb-1.5 font-semibold">Preview:</p>
              <div className="text-white text-sm font-semibold whitespace-nowrap overflow-x-auto scrollbar-hide flex gap-8">
                {bannerMessages.map((msg, i) => <span key={i}>{msg}</span>)}
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent Specials History ── */}
        {specials.filter(s => s.valid_date !== new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })).length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Past Specials</h2>
            </div>
            <div className="p-6 space-y-2">
              {specials
                .filter(s => s.valid_date !== new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }))
                .slice(0, 5)
                .map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{s.menu_item_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(s.valid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {formatPrice(s.special_price)} ({s.discount_percentage}% off)
                      </p>
                    </div>
                    <button
                      onClick={async () => { await deleteDailySpecial(s.id); loadSpecials() }}
                      className="text-sm text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

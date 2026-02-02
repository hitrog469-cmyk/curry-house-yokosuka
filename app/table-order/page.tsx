'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatPrice } from '@/lib/utils'
import { menuItems, menuCategories } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TableOrderContent() {
  const searchParams = useSearchParams()
  const urlTableNumber = searchParams.get('table')

  // Order setup state
  const [setupComplete, setSetupComplete] = useState(false)
  const [selectedTables, setSelectedTables] = useState<number[]>(urlTableNumber ? [parseInt(urlTableNumber)] : [])
  const [customerName, setCustomerName] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('1')
  const [splitBill, setSplitBill] = useState(false)
  const [splitType, setSplitType] = useState<'equal' | 'by-items'>('equal')
  const [splitPersons, setSplitPersons] = useState<{name: string, items: string[]}[]>([{name: '', items: []}, {name: '', items: []}])

  // Ordering state
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedSpiceLevels, setSelectedSpiceLevels] = useState<{[itemId: string]: string}>({})
  const [showSpiceLevelModal, setShowSpiceLevelModal] = useState<string | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Use menuCategories from data file for consistent categories
  const categories = menuCategories.filter(c =>
    c.id === 'all' || menuItems.some(item => item.category === c.id)
  )

  // Filter items by category AND search query
  const filteredItems = useMemo(() => {
    let items = selectedCategory === 'all'
      ? menuItems
      : selectedCategory === 'recommended'
        ? menuItems.filter(item => item.isRecommended)
        : menuItems.filter(item => item.category === selectedCategory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.nameJp.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    }

    return items
  }, [selectedCategory, searchQuery])

  const toggleTable = (tableNum: number) => {
    setSelectedTables(prev =>
      prev.includes(tableNum)
        ? prev.filter(t => t !== tableNum)
        : [...prev, tableNum]
    )
  }

  const addSplitPerson = () => {
    setSplitPersons(prev => [...prev, {name: '', items: []}])
  }

  const removeSplitPerson = (index: number) => {
    setSplitPersons(prev => prev.filter((_, i) => i !== index))
  }

  const updateSplitPersonName = (index: number, name: string) => {
    setSplitPersons(prev => prev.map((p, i) => i === index ? {...p, name} : p))
  }

  // Toggle an item assignment for a person in by-items split
  const toggleItemForPerson = (personIndex: number, itemId: string) => {
    setSplitPersons(prev => prev.map((p, i) => {
      if (i !== personIndex) return p
      const hasItem = p.items.includes(itemId)
      return {
        ...p,
        items: hasItem ? p.items.filter(id => id !== itemId) : [...p.items, itemId]
      }
    }))
  }

  const addToCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    const needsSpiceLevel = item?.spiceLevel || item?.category?.includes('curry')

    if (needsSpiceLevel && !selectedSpiceLevels[itemId]) {
      setPendingItemId(itemId)
      setShowSpiceLevelModal(itemId)
      return
    }

    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId]--
      } else {
        delete newCart[itemId]
        setSelectedSpiceLevels(prevLevels => {
          const newLevels = { ...prevLevels }
          delete newLevels[itemId]
          return newLevels
        })
      }
      return newCart
    })
  }

  const selectSpiceLevel = (itemId: string, level: string) => {
    setSelectedSpiceLevels(prev => ({
      ...prev,
      [itemId]: level
    }))
  }

  const confirmSpiceLevel = () => {
    if (!pendingItemId) return
    setShowSpiceLevelModal(null)
    setCart(prev => ({
      ...prev,
      [pendingItemId]: (prev[pendingItemId] || 0) + 1
    }))
    setPendingItemId(null)
  }

  const getSpiceLevelEmoji = (level: string) => {
    const emojis: Record<string, string> = {
      'MILD': '🟢',
      'NORMAL': '🟡',
      'MEDIUM': '🟠',
      'HOT': '🔴',
      'VERY HOT': '🔥'
    }
    return emojis[level] || '🌶️'
  }

  const getSpiceLevelJapanese = (level: string) => {
    const japanese: Record<string, string> = {
      'MILD': '甘口',
      'NORMAL': '普通',
      'MEDIUM': '中辛',
      'HOT': '辛口',
      'VERY HOT': '激辛'
    }
    return japanese[level] || ''
  }

  const getSpiceColor = (level?: string) => {
    if (!level) return ''
    const colors: Record<string, string> = {
      'MILD': 'bg-green-100 text-green-800 border-green-300',
      'NORMAL': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'MEDIUM': 'bg-orange-100 text-orange-800 border-orange-300',
      'HOT': 'bg-red-100 text-red-800 border-red-300',
      'VERY HOT': 'bg-red-200 text-red-900 border-red-400'
    }
    return colors[level] || ''
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(i => i.id === itemId)
      return total + (item?.price || 0) * quantity
    }, 0)
  }

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  }

  // Get per-person total for by-items split
  const getPersonTotal = (personItems: string[]) => {
    return personItems.reduce((total, itemId) => {
      const item = menuItems.find(i => i.id === itemId)
      const qty = cart[itemId] || 0
      return total + (item?.price || 0) * qty
    }, 0)
  }

  const handleSetupComplete = () => {
    if (selectedTables.length === 0 || !customerName || !numberOfPeople) {
      alert('Please fill in all required fields')
      return
    }

    if (splitBill) {
      const validPersons = splitPersons.filter(p => p.name.trim() !== '')
      if (validPersons.length < 2) {
        alert('Please add at least 2 people for bill splitting')
        return
      }
    }

    setSetupComplete(true)
  }

  const handleSubmitOrder = async () => {
    if (Object.keys(cart).length === 0) return

    setLoading(true)

    try {
      const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.id === itemId)
        return {
          item_id: itemId,
          name: item?.name,
          quantity,
          price: item?.price,
          subtotal: (item?.price || 0) * quantity,
          spiceLevel: selectedSpiceLevels[itemId] || null
        }
      })

      const totalAmount = getCartTotal()
      const validSplitPersons = splitBill ? splitPersons.filter(p => p.name.trim() !== '') : []
      const numberOfSplits = validSplitPersons.length || 1

      // For equal split, calculate per-person amount
      // For by-items split, each person's amount is based on their assigned items
      const splitDetails = splitBill ? validSplitPersons.map(person => ({
        name: person.name,
        amount: splitType === 'equal'
          ? totalAmount / numberOfSplits
          : getPersonTotal(person.items),
        items: splitType === 'by-items' ? person.items : []
      })) : []

      const tableNumbers = selectedTables.join(', ')

      const { data: tableOrderData, error: tableError } = await supabase
        .from('table_orders')
        .insert({
          table_number: selectedTables[0],
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          number_of_splits: numberOfSplits,
          items: orderItems,
          total_amount: totalAmount,
          amount_per_split: splitType === 'equal' ? totalAmount / numberOfSplits : 0,
          status: 'pending',
          order_type: 'in-house',
          notes: `Tables: ${tableNumbers}${splitBill ? ` | Split (${splitType}): ${validSplitPersons.map(p => p.name).join(', ')}` : ''}`
        })
        .select()

      if (tableError) throw tableError

      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: totalAmount,
          status: 'pending',
          order_type: 'in-house',
          table_number: selectedTables[0],
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          number_of_splits: numberOfSplits,
          items: orderItems,
          payment_status: 'pending',
          delivery_address: `Tables: ${tableNumbers} - ${customerName} (${numberOfPeople} ${parseInt(numberOfPeople) === 1 ? 'person' : 'people'})`,
          notes: splitBill ? `Split bill (${splitType}): ${JSON.stringify(splitDetails)}` : ''
        })

      if (orderError) console.error('Failed to sync to orders table:', orderError)

      setOrderSubmitted(true)
      setCart({})
      setSelectedSpiceLevels({})

      setTimeout(() => {
        setOrderSubmitted(false)
        setSetupComplete(false)
        setSelectedTables([])
        setCustomerName('')
        setNumberOfPeople('1')
        setSplitBill(false)
        setSplitPersons([{name: '', items: []}, {name: '', items: []}])
      }, 5000)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // SETUP SCREEN
  // ==========================================
  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        {/* Background glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto relative z-10">
          {/* Logo header */}
          <div className="text-center mb-6">
            <img src="/images/Logo.png" alt="The Curry House" className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-black text-gray-900">Table Order</h1>
            <p className="text-gray-500 text-sm mt-1">The Curry House Yokosuka</p>
          </div>

          <div className="space-y-5">
            {/* Table Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Table(s) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => toggleTable(num)}
                    className={`p-2.5 rounded-xl font-bold transition-all text-sm ${
                      selectedTables.includes(num)
                        ? 'bg-green-600 text-white shadow-md scale-105 ring-2 ring-green-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {selectedTables.length > 0 && (
                <p className="text-xs text-green-600 mt-2 font-semibold">
                  Table {selectedTables.sort((a, b) => a - b).join(', ')} selected
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-base bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Number of People */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Number of People <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-base bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Split Bill Toggle */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-bold text-gray-700">Split Bill?</span>
                  <span className="block text-xs text-gray-500">Split your bill between friends</span>
                </div>
                <div className={`relative w-12 h-7 rounded-full transition-colors ${splitBill ? 'bg-green-500' : 'bg-gray-300'}`}
                  onClick={() => {
                    const next = !splitBill
                    setSplitBill(next)
                    if (next && splitPersons.length < 2) {
                      setSplitPersons([{name: '', items: []}, {name: '', items: []}])
                    }
                  }}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${splitBill ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </div>
              </label>

              {splitBill && (
                <div className="mt-4 space-y-3">
                  {/* Split Type */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitType('equal')}
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'equal'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Split Equally
                    </button>
                    <button
                      onClick={() => setSplitType('by-items')}
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'by-items'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Split by Items
                    </button>
                  </div>

                  {/* Person Names */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      {splitType === 'equal' ? 'Who\'s splitting?' : 'Add people - assign items while ordering'}
                    </label>
                    {splitPersons.map((person, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateSplitPersonName(index, e.target.value)}
                          placeholder={`Person ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-sm bg-white"
                        />
                        {splitPersons.length > 2 && (
                          <button
                            onClick={() => removeSplitPerson(index)}
                            className="px-2.5 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addSplitPerson}
                      className="w-full py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-semibold text-sm mt-1 transition-colors"
                    >
                      + Add Person
                    </button>
                  </div>

                  {splitType === 'by-items' && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-700">
                        💡 You'll assign menu items to each person while ordering. Each person pays for their own items.
                      </p>
                    </div>
                  )}

                  {splitType === 'equal' && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs text-green-700">
                        ✨ The total bill will be split equally between everyone.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleSetupComplete}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg"
            >
              Start Ordering
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // ORDER CONFIRMATION SCREEN
  // ==========================================
  if (orderSubmitted) {
    const validSplitPersons = splitBill ? splitPersons.filter(p => p.name.trim() !== '') : []
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 max-w-md shadow-2xl animate-scaleIn">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Order Sent!</h1>
          <p className="text-gray-500 mb-5">Your order is being prepared</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-1">
            <p className="text-2xl font-black text-green-600">Table {selectedTables.join(', ')}</p>
            <p className="text-gray-700 font-medium">{customerName}</p>
            <p className="text-gray-500 text-sm">{numberOfPeople} {parseInt(numberOfPeople) === 1 ? 'person' : 'people'}</p>
          </div>

          {splitBill && validSplitPersons.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-100">
              <p className="text-sm font-bold text-blue-900 mb-2">Bill Split Summary</p>
              <div className="space-y-1.5">
                {validSplitPersons.map((person, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-blue-800">{person.name}</span>
                    <span className="font-bold text-blue-900">
                      {splitType === 'equal'
                        ? formatPrice(getCartTotal() / validSplitPersons.length)
                        : formatPrice(getPersonTotal(person.items))
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">Your meal will be ready shortly. Thank you! 🙏</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // MAIN ORDERING SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* ===== STICKY TOP BAR ===== */}
      <div className="sticky top-0 z-50">
        {/* Header with table info & total */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container-custom py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img src="/images/Logo.png" alt="" className="w-8 h-8 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-bold truncate">Table {selectedTables.join(', ')}</h1>
                  <p className="text-gray-400 text-xs truncate">{customerName} &middot; {numberOfPeople}p</p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-4">
                <div className="text-xl font-black">{formatPrice(getCartTotal())}</div>
                <div className="text-xs text-gray-400">{getCartCount()} items</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-custom py-2.5">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu... (English / 日本語)"
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category filter - horizontal scroll */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container-custom py-2">
            <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSearchQuery('')
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MENU ITEMS ===== */}
      <div className="container-custom py-4">
        {searchQuery && (
          <p className="text-xs text-gray-500 mb-3">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
          </p>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map(item => {
              const quantity = cart[item.id] || 0
              const imagePath = getMenuItemImage(item.id)

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="flex gap-3 p-3">
                    {/* Image - matching menu website photos */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      {imagePath ? (
                        <Image
                          src={imagePath}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 96px, 112px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
                          <span className="text-3xl">🍽️</span>
                        </div>
                      )}
                      {item.isRecommended && (
                        <div className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow">
                          PICK
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.nameJp}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.description}</p>
                      )}

                      {selectedSpiceLevels[item.id] && (
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold border mt-1 ${getSpiceColor(selectedSpiceLevels[item.id])}`}>
                          {getSpiceLevelEmoji(selectedSpiceLevels[item.id])} {selectedSpiceLevels[item.id]}
                        </span>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-black text-green-600">{formatPrice(item.price)}</span>

                        {quantity === 0 ? (
                          <button
                            onClick={() => addToCart(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded-lg transition-all text-xs"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-green-50 rounded-lg p-0.5 border border-green-200">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="bg-white text-green-600 font-bold w-7 h-7 rounded-md transition-all text-sm shadow-sm"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-green-700 w-6 text-center">{quantity}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="bg-white text-green-600 font-bold w-7 h-7 rounded-md transition-all text-sm shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== FIXED BOTTOM BAR ===== */}
      {getCartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 safe-bottom">
          <div className="container-custom py-3">
            <div className="flex gap-2">
              {/* View Cart button */}
              <button
                onClick={() => setShowCart(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
              >
                View Cart ({getCartCount()}) &middot; {formatPrice(getCartTotal())}
              </button>

              {/* Split bill button - visible only if split is on */}
              {splitBill && splitType === 'by-items' && (
                <button
                  onClick={() => setShowSplitModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3.5 rounded-xl transition-all text-xs shadow-md"
                >
                  Split
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CART DRAWER ===== */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCart(false)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            {/* Cart header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-black text-gray-900">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart items */}
            <div className="overflow-y-auto max-h-[50vh] p-5 space-y-3">
              {Object.entries(cart).map(([itemId, quantity]) => {
                const item = menuItems.find(i => i.id === itemId)
                if (!item) return null
                const img = getMenuItemImage(itemId)

                return (
                  <div key={itemId} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                      {img ? (
                        <Image src={img} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      {selectedSpiceLevels[itemId] && (
                        <p className="text-[10px] text-gray-500">{getSpiceLevelEmoji(selectedSpiceLevels[itemId])} {selectedSpiceLevels[itemId]}</p>
                      )}
                      <p className="text-sm font-bold text-green-600">{formatPrice(item.price * quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => removeFromCart(itemId)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-bold text-gray-600 transition-colors">-</button>
                      <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                      <button onClick={() => addToCart(itemId)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-bold text-gray-600 transition-colors">+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Split summary in cart */}
            {splitBill && (
              <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900">Bill Split ({splitType === 'equal' ? 'Equal' : 'By Items'})</span>
                  {splitType === 'by-items' && (
                    <button onClick={() => { setShowCart(false); setShowSplitModal(true) }} className="text-xs text-blue-600 font-bold hover:underline">
                      Assign Items
                    </button>
                  )}
                </div>
                {splitPersons.filter(p => p.name.trim()).map((person, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-blue-800">
                    <span>{person.name}</span>
                    <span className="font-bold">
                      {splitType === 'equal'
                        ? formatPrice(getCartTotal() / splitPersons.filter(p => p.name.trim()).length)
                        : formatPrice(getPersonTotal(person.items))
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Cart footer */}
            <div className="p-5 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">Total</span>
                <span className="text-2xl font-black text-gray-900">{formatPrice(getCartTotal())}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); handleSubmitOrder() }}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 text-base"
              >
                {loading ? 'Sending...' : 'Send to Kitchen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SPLIT BY ITEMS MODAL ===== */}
      {showSplitModal && splitType === 'by-items' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowSplitModal(false)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-black text-gray-900">Assign Items to People</h2>
              <button onClick={() => setShowSplitModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-5">
              {splitPersons.filter(p => p.name.trim()).map((person, pIdx) => (
                <div key={pIdx} className="mb-6">
                  <h3 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-black">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    {person.name}
                    <span className="ml-auto text-green-600 text-xs font-bold">{formatPrice(getPersonTotal(person.items))}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = menuItems.find(i => i.id === itemId)
                      if (!item) return null
                      const isAssigned = person.items.includes(itemId)

                      return (
                        <button
                          key={itemId}
                          onClick={() => toggleItemForPerson(pIdx, itemId)}
                          className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all text-sm ${
                            isAssigned
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isAssigned ? 'bg-green-500 text-white' : 'bg-gray-200'
                          }`}>
                            {isAssigned && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="flex-1 truncate text-gray-800">{item.name} x{qty}</span>
                          <span className="text-gray-500 text-xs shrink-0">{formatPrice(item.price * qty)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t">
              <button
                onClick={() => setShowSplitModal(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SPICE LEVEL MODAL ===== */}
      {showSpiceLevelModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto animate-slideUp">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item) return null

              const spiceLevels = ['MILD', 'NORMAL', 'MEDIUM', 'HOT', 'VERY HOT']

              return (
                <div className="p-5">
                  <div className="mb-4 text-center">
                    <div className="text-3xl mb-2">🌶️</div>
                    <h3 className="text-lg font-black text-gray-900">{item.name}</h3>
                    <p className="text-gray-500 text-xs">{item.nameJp}</p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {spiceLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => selectSpiceLevel(item.id, level)}
                        className={`w-full p-3 rounded-xl border-2 transition-all ${
                          selectedSpiceLevels[item.id] === level
                            ? `${getSpiceColor(level)} border-current shadow-sm`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getSpiceLevelEmoji(level)}</span>
                            <div className="text-left">
                              <span className="block font-bold text-gray-900 text-sm">{level}</span>
                              <span className="block text-[11px] text-gray-500">{getSpiceLevelJapanese(level)}</span>
                            </div>
                          </div>
                          {selectedSpiceLevels[item.id] === level && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowSpiceLevelModal(null); setPendingItemId(null) }}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSpiceLevel}
                      disabled={!selectedSpiceLevels[item.id]}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TableOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/Logo.png" alt="" className="w-16 h-16 mx-auto mb-4 animate-pulse-slow" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <TableOrderContent />
    </Suspense>
  )
}

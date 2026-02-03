'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatPrice } from '@/lib/utils'
import { menuItems, menuCategories, type MenuItem, type AddOn } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

// ============================================
// QR-ONLY TABLE ORDERING SYSTEM
// ============================================
// This page ONLY works when accessed via QR code with valid token
// URL format: /table-order?table=5&token=TCH-T05-E6P1
//
// Flow:
// 1. Customer scans QR → validates token → creates session
// 2. Customer orders → orders saved to session
// 3. When done, customer requests bill
// 4. Staff completes payment → releases table from staff panel

function TableOrderContent() {
  const searchParams = useSearchParams()
  const urlTableNumber = searchParams.get('table')
  const urlToken = searchParams.get('token')

  // Access validation states
  const [isValidating, setIsValidating] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [accessError, setAccessError] = useState('')
  const [tableOccupied, setTableOccupied] = useState(false)
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null)

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // Order setup state
  const [setupComplete, setSetupComplete] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('1')
  const [splitBill, setSplitBill] = useState(false)
  const [splitType, setSplitType] = useState<'equal' | 'by-items'>('equal')
  const [splitPersons, setSplitPersons] = useState<{name: string, items: string[]}[]>([{name: '', items: []}, {name: '', items: []}])

  // Ordering state
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedAddOns, setSelectedAddOns] = useState<{[itemId: string]: string[]}>({})
  const [selectedVariations, setSelectedVariations] = useState<{[itemId: string]: number}>({})
  const [selectedSpiceLevels, setSelectedSpiceLevels] = useState<{[itemId: string]: string}>({})

  // Modals
  const [showSpiceLevelModal, setShowSpiceLevelModal] = useState<string | null>(null)
  const [showAddOnModal, setShowAddOnModal] = useState<string | null>(null)
  const [showBeverageModal, setShowBeverageModal] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [showBillRequest, setShowBillRequest] = useState(false)
  const [billRequested, setBillRequested] = useState(false)

  // Beverage state for the popup
  const [beverageQuantities, setBeverageQuantities] = useState<{[itemId: string]: number}>({})

  // All orders for this session
  const [sessionOrders, setSessionOrders] = useState<any[]>([])
  const [sessionTotal, setSessionTotal] = useState(0)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ============================================
  // VALIDATE QR ACCESS ON MOUNT
  // ============================================
  useEffect(() => {
    validateQRAccess()
  }, [urlTableNumber, urlToken])

  const validateQRAccess = async () => {
    setIsValidating(true)
    setAccessDenied(false)
    setAccessError('')
    setTableOccupied(false)

    // Check if URL has required params
    if (!urlTableNumber || !urlToken) {
      setAccessDenied(true)
      setAccessError('invalid_access')
      setIsValidating(false)
      return
    }

    const tableNum = parseInt(urlTableNumber)
    if (isNaN(tableNum) || tableNum < 1 || tableNum > 18) {
      setAccessDenied(true)
      setAccessError('invalid_table')
      setIsValidating(false)
      return
    }

    try {
      // Validate the token matches the table
      const { data: tokenData, error: tokenError } = await supabase
        .from('table_qr_tokens')
        .select('*')
        .eq('table_number', tableNum)
        .eq('token', urlToken)
        .eq('is_active', true)
        .single()

      if (tokenError || !tokenData) {
        setAccessDenied(true)
        setAccessError('invalid_token')
        setIsValidating(false)
        return
      }

      // Check if table already has an active session
      const { data: existingSession, error: sessionError } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('table_number', tableNum)
        .in('status', ['active', 'ordering', 'bill_requested'])
        .single()

      if (existingSession) {
        // Table is occupied - check if this is the same browser session
        const storedSessionId = localStorage.getItem(`table_session_${tableNum}`)

        if (storedSessionId === existingSession.id) {
          // Same session - allow access and restore state
          setSessionId(existingSession.id)
          setSessionToken(existingSession.session_token)
          setCustomerName(existingSession.customer_name || '')
          setNumberOfPeople(String(existingSession.party_size || 1))
          setSessionOrders(existingSession.orders || [])
          setSessionTotal(existingSession.total_amount || 0)
          setBillRequested(existingSession.status === 'bill_requested')
          setSetupComplete(true)
          setIsValidating(false)
          return
        } else {
          // Different session - table is occupied
          setTableOccupied(true)
          setExistingSessionId(existingSession.id)
          setAccessDenied(true)
          setAccessError('table_occupied')
          setIsValidating(false)
          return
        }
      }

      // Token is valid and table is free - access granted
      setSessionToken(urlToken)
      setIsValidating(false)

    } catch (error) {
      console.error('Validation error:', error)
      setAccessDenied(true)
      setAccessError('system_error')
      setIsValidating(false)
    }
  }

  // ============================================
  // CREATE SESSION WHEN SETUP IS COMPLETE
  // ============================================
  const handleSetupComplete = async () => {
    if (!customerName || !numberOfPeople) {
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

    setLoading(true)

    try {
      // Create a new session
      const newSessionToken = `${urlToken}-${Date.now()}`
      const { data: newSession, error } = await supabase
        .from('table_sessions')
        .insert({
          table_number: parseInt(urlTableNumber!),
          session_token: newSessionToken,
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          status: 'active',
          orders: [],
          total_amount: 0
        })
        .select()
        .single()

      if (error) throw error

      // Store session ID in localStorage to allow page refresh
      localStorage.setItem(`table_session_${urlTableNumber}`, newSession.id)

      setSessionId(newSession.id)
      setSetupComplete(true)
    } catch (error: any) {
      console.error('Failed to create session:', error)
      if (error.code === '23505') { // Unique constraint violation
        alert('This table is now occupied by someone else. Please ask staff for assistance.')
        setTableOccupied(true)
        setAccessDenied(true)
        setAccessError('table_occupied')
      } else {
        alert('Failed to start your session. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const categories = menuCategories.filter(c =>
    c.id === 'all' || menuItems.some(item => item.category === c.id)
  )

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

  const addSplitPerson = () => {
    setSplitPersons(prev => [...prev, {name: '', items: []}])
  }

  const removeSplitPerson = (index: number) => {
    setSplitPersons(prev => prev.filter((_, i) => i !== index))
  }

  const updateSplitPersonName = (index: number, name: string) => {
    setSplitPersons(prev => prev.map((p, i) => i === index ? {...p, name} : p))
  }

  // Check if an item is already assigned to another person (for qty=1 items)
  const isItemAssignedElsewhere = (personIndex: number, itemId: string) => {
    const qty = cart[itemId] || 0
    if (qty > 1) return false
    return splitPersons.some((p, i) => i !== personIndex && p.items.includes(itemId))
  }

  const toggleItemForPerson = (personIndex: number, itemId: string) => {
    const qty = cart[itemId] || 0
    if (qty <= 1 && isItemAssignedElsewhere(personIndex, itemId)) {
      return
    }
    setSplitPersons(prev => prev.map((p, i) => {
      if (i !== personIndex) return p
      const hasItem = p.items.includes(itemId)
      return {
        ...p,
        items: hasItem ? p.items.filter(id => id !== itemId) : [...p.items, itemId]
      }
    }))
  }

  // ========================
  // ITEM PRICE CALCULATION
  // ========================
  const getItemPrice = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return 0
    let basePrice = item.price
    if (item.variations && selectedVariations[itemId] !== undefined) {
      basePrice = item.variations[selectedVariations[itemId]].price
    }
    if (selectedAddOns[itemId]) {
      item.addOns?.forEach(addOn => {
        if (selectedAddOns[itemId]?.includes(addOn.name)) {
          basePrice += addOn.price
        }
      })
    }
    return basePrice
  }

  // ========================
  // ADD TO CART FLOW
  // ========================
  const addToCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return

    const needsSpiceLevel = item.spiceLevel || item.category?.includes('curry') || item.category === 'nepalese'
    if (needsSpiceLevel && !selectedSpiceLevels[itemId]) {
      setPendingItemId(itemId)
      setShowSpiceLevelModal(itemId)
      return
    }

    if (item.addOns && item.addOns.length > 0) {
      setPendingItemId(itemId)
      setShowAddOnModal(itemId)
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
        setSelectedAddOns(prevAddOns => {
          const newAddOns = { ...prevAddOns }
          delete newAddOns[itemId]
          return newAddOns
        })
        setSelectedVariations(prevVars => {
          const newVars = { ...prevVars }
          delete newVars[itemId]
          return newVars
        })
      }
      return newCart
    })
  }

  const selectSpiceLevel = (itemId: string, level: string) => {
    setSelectedSpiceLevels(prev => ({ ...prev, [itemId]: level }))
  }

  const selectVariation = (itemId: string, variationIndex: number) => {
    setSelectedVariations(prev => ({ ...prev, [itemId]: variationIndex }))
  }

  const toggleAddOn = (itemId: string, addOnName: string) => {
    setSelectedAddOns(prev => {
      const current = prev[itemId] || []
      const updated = current.includes(addOnName)
        ? current.filter(name => name !== addOnName)
        : [...current, addOnName]
      return { ...prev, [itemId]: updated }
    })
  }

  const confirmSpiceLevel = () => {
    if (!pendingItemId) return
    const item = menuItems.find(i => i.id === pendingItemId)
    setShowSpiceLevelModal(null)

    if (item?.addOns && item.addOns.length > 0) {
      setShowAddOnModal(pendingItemId)
    } else {
      setCart(prev => ({ ...prev, [pendingItemId]: (prev[pendingItemId] || 0) + 1 }))
      setPendingItemId(null)
    }
  }

  const confirmAddToCart = () => {
    if (!pendingItemId) return
    setCart(prev => ({ ...prev, [pendingItemId]: (prev[pendingItemId] || 0) + 1 }))
    setShowAddOnModal(null)
    setPendingItemId(null)
  }

  const skipAddOns = () => {
    if (!pendingItemId) return
    setSelectedAddOns(prev => {
      const updated = { ...prev }
      delete updated[pendingItemId]
      return updated
    })
    setCart(prev => ({ ...prev, [pendingItemId]: (prev[pendingItemId] || 0) + 1 }))
    setShowAddOnModal(null)
    setPendingItemId(null)
  }

  // ========================
  // BEVERAGE SUGGESTIONS
  // ========================
  const getBeverageSuggestions = () => {
    const beverageIds = new Set<string>()
    const cartItemIds = Object.keys(cart)
    cartItemIds.forEach(itemId => {
      const item = menuItems.find(i => i.id === itemId)
      if (!item) return
      if (item.category.includes('curry') || item.category === 'nepalese' || item.category === 'sets') {
        beverageIds.add('beer-2')
        beverageIds.add('beer-3')
      }
      if (item.category === 'mexican' || item.category === 'starters') {
        beverageIds.add('beer-1')
        beverageIds.add('marg-1')
      }
      if (item.category === 'tandoori' || item.category === 'fried') {
        beverageIds.add('beer-4')
        beverageIds.add('beer-5')
      }
    })
    beverageIds.add('drink-1')
    beverageIds.add('drink-2')
    return menuItems.filter(i => beverageIds.has(i.id)).slice(0, 4)
  }

  const updateBeverageQty = (beverageId: string, change: number) => {
    setBeverageQuantities(prev => {
      const current = prev[beverageId] || 0
      const newQty = Math.max(0, current + change)
      if (newQty === 0) {
        const { [beverageId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [beverageId]: newQty }
    })
  }

  const addBeverages = () => {
    Object.entries(beverageQuantities).forEach(([beverageId, qty]) => {
      if (qty > 0) {
        setCart(prev => ({ ...prev, [beverageId]: (prev[beverageId] || 0) + qty }))
      }
    })
    setBeverageQuantities({})
    setShowBeverageModal(false)
  }

  const skipBeverages = () => {
    setBeverageQuantities({})
    setShowBeverageModal(false)
  }

  // ========================
  // HELPERS
  // ========================
  const getSpiceLevelEmoji = (level: string) => {
    const emojis: Record<string, string> = { 'MILD': '🟢', 'NORMAL': '🟡', 'MEDIUM': '🟠', 'HOT': '🔴', 'VERY HOT': '🔥' }
    return emojis[level] || '🌶️'
  }

  const getSpiceLevelJapanese = (level: string) => {
    const japanese: Record<string, string> = { 'MILD': '甘口', 'NORMAL': '普通', 'MEDIUM': '中辛', 'HOT': '辛口', 'VERY HOT': '激辛' }
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
      return total + getItemPrice(itemId) * quantity
    }, 0)
  }

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  }

  const getPersonTotal = (personItems: string[]) => {
    return personItems.reduce((total, itemId) => {
      const qty = cart[itemId] || 0
      return total + getItemPrice(itemId) * qty
    }, 0)
  }

  const getItemDisplayName = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return ''
    let name = item.name
    if (item.variations && selectedVariations[itemId] !== undefined) {
      name += ` (${item.variations[selectedVariations[itemId]].name})`
    }
    return name
  }

  // ========================
  // SUBMIT ORDER — Save to session
  // ========================
  const initiateSubmitOrder = () => {
    if (Object.keys(cart).length === 0) return

    const hasAlcohol = Object.keys(cart).some(id => {
      const item = menuItems.find(i => i.id === id)
      return item?.category === 'cocktails' || item?.category === 'margaritas'
    })

    if (!hasAlcohol) {
      setShowBeverageModal(true)
      setShowCart(false)
    } else {
      handleSubmitOrder()
    }
  }

  const handleSubmitOrder = async () => {
    if (Object.keys(cart).length === 0 || !sessionId) return
    setLoading(true)

    try {
      const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.id === itemId)
        return {
          item_id: itemId,
          name: getItemDisplayName(itemId),
          quantity,
          price: getItemPrice(itemId),
          subtotal: getItemPrice(itemId) * quantity,
          spiceLevel: selectedSpiceLevels[itemId] || null,
          addOns: selectedAddOns[itemId] || [],
          variation: item?.variations && selectedVariations[itemId] !== undefined
            ? item.variations[selectedVariations[itemId]].name
            : null
        }
      })

      const orderTotal = getCartTotal()
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`

      const newOrder = {
        order_number: orderNumber,
        items: orderItems,
        total: orderTotal,
        created_at: new Date().toISOString()
      }

      // Update session with new order
      const updatedOrders = [...sessionOrders, newOrder]
      const updatedTotal = sessionTotal + orderTotal

      const { error: updateError } = await supabase
        .from('table_sessions')
        .update({
          status: 'ordering',
          orders: updatedOrders,
          total_amount: updatedTotal
        })
        .eq('id', sessionId)

      if (updateError) throw updateError

      // Also create entry in table_orders for kitchen
      const { error: tableError } = await supabase
        .from('table_orders')
        .insert({
          table_number: parseInt(urlTableNumber!),
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          items: orderItems,
          total_amount: orderTotal,
          status: 'pending',
          order_type: 'in-house',
          notes: `Session: ${sessionId} | Order: ${orderNumber}`
        })

      if (tableError) console.error('Failed to sync to table_orders:', tableError)

      // Update local state
      setSessionOrders(updatedOrders)
      setSessionTotal(updatedTotal)
      setOrderSubmitted(true)
      setCart({})
      setSelectedSpiceLevels({})
      setSelectedAddOns({})
      setSelectedVariations({})

      // Reset order submitted after showing confirmation
      setTimeout(() => {
        setOrderSubmitted(false)
      }, 4000)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ========================
  // REQUEST BILL
  // ========================
  const handleRequestBill = async () => {
    if (!sessionId) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('table_sessions')
        .update({ status: 'bill_requested' })
        .eq('id', sessionId)

      if (error) throw error

      setBillRequested(true)
      setShowBillRequest(false)
    } catch (error) {
      console.error('Error requesting bill:', error)
      alert('Failed to request bill. Please ask a staff member.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <div className="text-center">
          <img src="/images/Logo.png" alt="" className="w-20 h-20 mx-auto mb-4 animate-pulse" />
          <p className="text-stone-400">Validating your table access...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // ACCESS DENIED SCREEN
  // ==========================================
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            {tableOccupied ? (
              <span className="text-4xl">🪑</span>
            ) : (
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          {accessError === 'invalid_access' && (
            <>
              <h1 className="text-2xl font-black text-stone-800 mb-2">QR Code Required</h1>
              <p className="text-stone-500 mb-6">
                Table ordering is only available when you scan the QR code at your table. Please scan the QR code to start ordering.
              </p>
            </>
          )}

          {accessError === 'invalid_token' && (
            <>
              <h1 className="text-2xl font-black text-stone-800 mb-2">Invalid QR Code</h1>
              <p className="text-stone-500 mb-6">
                This QR code is not valid. Please scan the correct QR code at your table or ask our staff for assistance.
              </p>
            </>
          )}

          {accessError === 'invalid_table' && (
            <>
              <h1 className="text-2xl font-black text-stone-800 mb-2">Invalid Table</h1>
              <p className="text-stone-500 mb-6">
                This table number is not valid. Please scan the QR code at your assigned table.
              </p>
            </>
          )}

          {accessError === 'table_occupied' && (
            <>
              <h1 className="text-2xl font-black text-stone-800 mb-2">Table Currently In Use</h1>
              <p className="text-stone-500 mb-6">
                This table already has an active order session. If you're part of this group, please use the original device. If this seems wrong, please ask our staff to reset the table.
              </p>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
                <p className="text-amber-700 text-sm font-medium">
                  💡 If the previous customers left, our staff can release this table for you.
                </p>
              </div>
            </>
          )}

          {accessError === 'system_error' && (
            <>
              <h1 className="text-2xl font-black text-stone-800 mb-2">Something Went Wrong</h1>
              <p className="text-stone-500 mb-6">
                We couldn't validate your access. Please try scanning the QR code again or ask our staff for help.
              </p>
            </>
          )}

          <div className="space-y-3">
            <Link href="/" className="block w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all">
              Back to Homepage
            </Link>
            <Link href="/menu" className="block w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3.5 rounded-xl transition-all">
              Browse Our Menu
            </Link>
          </div>

          <p className="text-xs text-stone-400 mt-6">
            Need help? Ask any of our staff members.
          </p>
        </div>
      </div>
    )
  }

  // ==========================================
  // BILL REQUESTED STATE
  // ==========================================
  if (billRequested) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">🧾</span>
          </div>
          <h1 className="text-2xl font-black text-stone-800 mb-2">Bill Requested!</h1>
          <p className="text-stone-500 mb-6">
            Our staff will bring your bill shortly. Thank you for dining with us!
          </p>

          {/* Bill Summary */}
          <div className="bg-stone-50 rounded-2xl p-5 mb-6 text-left border border-stone-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
              <span className="font-bold text-stone-700">Table {urlTableNumber}</span>
              <span className="text-stone-500 text-sm">{customerName}</span>
            </div>

            {sessionOrders.map((order, idx) => (
              <div key={idx} className="mb-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0 last:mb-0">
                <p className="text-xs text-stone-400 mb-1">Order #{order.order_number}</p>
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-stone-600">{item.name} x{item.quantity}</span>
                    <span className="text-stone-800 font-medium">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className="flex justify-between items-center pt-3 border-t border-stone-300 mt-3">
              <span className="text-lg font-black text-stone-800">Total</span>
              <span className="text-2xl font-black text-emerald-600">{formatPrice(sessionTotal)}</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-amber-700 text-sm">
              🙏 Please wait for staff to process your payment. Once complete, the table will be ready for the next guests.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // ORDER CONFIRMATION POPUP
  // ==========================================
  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 max-w-md shadow-2xl animate-scaleIn">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-stone-800 mb-2">Order Sent!</h1>
          <p className="text-stone-500 mb-5">Your food is being prepared with care.</p>

          <div className="bg-stone-50 rounded-xl p-4 mb-5 space-y-1">
            <p className="text-2xl font-black text-emerald-600">Table {urlTableNumber}</p>
            <p className="text-stone-700 font-medium">{customerName}</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-emerald-700 text-sm">
              You can continue ordering more items. When you're done, request the bill!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // SETUP SCREEN
  // ==========================================
  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto relative z-10">
          {/* Welcome header */}
          <div className="text-center mb-6">
            <img src="/images/Logo.png" alt="The Curry House" className="w-16 h-16 mx-auto mb-3" />
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold mb-3">
              Table {urlTableNumber}
            </div>
            <h1 className="text-2xl font-black text-stone-800">Welcome!</h1>
            <p className="text-stone-500 text-sm mt-1">Let's get your order started.</p>
          </div>

          <div className="space-y-5">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none text-base bg-stone-50 focus:bg-white transition-all"
              />
            </div>

            {/* Number of People */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                How Many Are Dining? <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none text-base bg-stone-50 focus:bg-white transition-all"
              />
            </div>

            {/* Split Bill Toggle */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-bold text-stone-700">Split the Bill?</span>
                  <span className="block text-xs text-stone-500">We'll calculate each person's share</span>
                </div>
                <div className={`relative w-12 h-7 rounded-full transition-colors ${splitBill ? 'bg-emerald-500' : 'bg-stone-300'}`}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitType('equal')}
                      className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'equal'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      Split Equally
                    </button>
                    <button
                      onClick={() => setSplitType('by-items')}
                      className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'by-items'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      By Items
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-2">
                      Who's splitting?
                    </label>
                    {splitPersons.map((person, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateSplitPersonName(index, e.target.value)}
                          placeholder={`Person ${index + 1}`}
                          className="flex-1 px-3 py-2.5 border-2 border-stone-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm bg-white"
                        />
                        {splitPersons.length > 2 && (
                          <button
                            onClick={() => removeSplitPerson(index)}
                            className="px-2.5 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
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
                      className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-semibold text-sm mt-1"
                    >
                      + Add Person
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleSetupComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg disabled:opacity-50"
            >
              {loading ? 'Starting...' : "Let's Order!"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // MAIN ORDERING SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-stone-100 pb-24">
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white">
          <div className="container-custom py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img src="/images/Logo.png" alt="" className="w-8 h-8 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-bold truncate">Table {urlTableNumber}</h1>
                  <p className="text-stone-400 text-xs truncate">Hi {customerName}!</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {sessionTotal > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-stone-400">Session Total</div>
                    <div className="text-sm font-bold text-emerald-400">{formatPrice(sessionTotal)}</div>
                  </div>
                )}
                <button
                  onClick={() => setShowBillRequest(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Request Bill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white border-b border-stone-200">
          <div className="container-custom py-2.5">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full pl-9 pr-8 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="bg-white border-b border-stone-200 shadow-sm">
          <div className="container-custom py-2">
            <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => { setSelectedCategory(category.id); setSearchQuery('') }}
                  className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MENU ITEMS */}
      <div className="container-custom py-4">
        {searchQuery && (
          <p className="text-xs text-stone-500 mb-3">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
          </p>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-stone-500 font-medium">No items found</p>
            <p className="text-stone-400 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map(item => {
              const quantity = cart[item.id] || 0
              const imagePath = getMenuItemImage(item.id)

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-stone-100">
                  <div className="flex gap-3 p-3">
                    {/* Image */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      {imagePath ? (
                        <Image
                          src={imagePath}
                          alt={item.name}
                          fill
                          className="object-cover scale-150"
                          sizes="(max-width: 640px) 112px, 128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                          <span className="text-4xl">🍛</span>
                        </div>
                      )}
                      {item.isRecommended && (
                        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
                          ⭐ TOP
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-stone-800 leading-tight">{item.name}</h3>
                      <p className="text-[11px] text-stone-400 mt-0.5">{item.nameJp}</p>
                      {item.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">{item.description}</p>
                      )}

                      {/* Spice level badge */}
                      {selectedSpiceLevels[item.id] && (
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold border mt-1 ${getSpiceColor(selectedSpiceLevels[item.id])}`}>
                          {getSpiceLevelEmoji(selectedSpiceLevels[item.id])} {selectedSpiceLevels[item.id]}
                        </span>
                      )}

                      {/* Selected add-ons display */}
                      {selectedAddOns[item.id] && selectedAddOns[item.id].length > 0 && (
                        <p className="text-[10px] text-sky-600 mt-0.5 font-medium">
                          + {selectedAddOns[item.id].join(', ')}
                        </p>
                      )}

                      {/* Variation display */}
                      {item.variations && selectedVariations[item.id] !== undefined && (
                        <p className="text-[10px] text-violet-600 mt-0.5 font-medium">
                          {item.variations[selectedVariations[item.id]].name}
                        </p>
                      )}

                      {/* Add-ons & Variations indicators for items not yet in cart */}
                      {!cart[item.id] && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variations && item.variations.length > 0 && (
                            <span className="text-[9px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold border border-violet-200">
                              {item.variations.length} Options
                            </span>
                          )}
                          {item.addOns && item.addOns.length > 0 && (
                            <span className="text-[9px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-full font-semibold border border-sky-200">
                              {item.addOns.length} Add-on{item.addOns.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {(item.spiceLevel || item.category?.includes('curry')) && (
                            <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full font-semibold border border-red-200">
                              🌶️ Spice
                            </span>
                          )}
                        </div>
                      )}

                      {/* Variations selector */}
                      {item.variations && item.variations.length > 0 && !cart[item.id] && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.variations.map((v, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectVariation(item.id, idx)}
                              className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all ${
                                (selectedVariations[item.id] ?? 0) === idx
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {v.name} {formatPrice(v.price)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-black text-emerald-600">{formatPrice(getItemPrice(item.id))}</span>

                        {quantity === 0 ? (
                          <button
                            onClick={() => addToCart(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg transition-all text-xs"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg p-0.5 border border-emerald-200">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="bg-white text-emerald-600 font-bold w-7 h-7 rounded-md transition-all text-sm shadow-sm"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-emerald-700 w-6 text-center">{quantity}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="bg-white text-emerald-600 font-bold w-7 h-7 rounded-md transition-all text-sm shadow-sm"
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

      {/* FIXED BOTTOM BAR */}
      {getCartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 safe-bottom">
          <div className="container-custom py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setShowCart(true)}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
              >
                View Cart ({getCartCount()}) · {formatPrice(getCartTotal())}
              </button>
              {splitBill && splitType === 'by-items' && (
                <button
                  onClick={() => setShowSplitModal(true)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-3.5 rounded-xl transition-all text-xs shadow-md"
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
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-black text-stone-800">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-stone-400 hover:text-stone-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[50vh] p-5 space-y-3">
              {Object.entries(cart).map(([itemId, quantity]) => {
                const item = menuItems.find(i => i.id === itemId)
                if (!item) return null
                const img = getMenuItemImage(itemId)

                return (
                  <div key={itemId} className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 shrink-0">
                      {img ? (
                        <Image src={img} alt={item.name} width={56} height={56} className="w-full h-full object-cover scale-[1.6]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-stone-800 truncate">{getItemDisplayName(itemId)}</p>
                      {selectedSpiceLevels[itemId] && (
                        <p className="text-[10px] text-stone-500">{getSpiceLevelEmoji(selectedSpiceLevels[itemId])} {selectedSpiceLevels[itemId]}</p>
                      )}
                      {selectedAddOns[itemId] && selectedAddOns[itemId].length > 0 && (
                        <p className="text-[10px] text-sky-600">+ {selectedAddOns[itemId].join(', ')}</p>
                      )}
                      <p className="text-sm font-bold text-emerald-600">{formatPrice(getItemPrice(itemId) * quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => removeFromCart(itemId)} className="w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-md text-sm font-bold text-stone-600">-</button>
                      <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                      <button onClick={() => addToCart(itemId)} className="w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-md text-sm font-bold text-stone-600">+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Split summary */}
            {splitBill && (
              <div className="px-5 py-3 bg-sky-50 border-t border-sky-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-900">Bill Split ({splitType === 'equal' ? 'Equal' : 'By Items'})</span>
                  {splitType === 'by-items' && (
                    <button onClick={() => { setShowCart(false); setShowSplitModal(true) }} className="text-xs text-sky-600 font-bold hover:underline">
                      Assign Items
                    </button>
                  )}
                </div>
                {splitPersons.filter(p => p.name.trim()).map((person, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-sky-800">
                    <span>{person.name}</span>
                    <span className="font-bold">
                      {splitType === 'equal'
                        ? formatPrice(Math.ceil(getCartTotal() / splitPersons.filter(p => p.name.trim()).length))
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
                <span className="text-stone-500 font-medium">This Order</span>
                <span className="text-2xl font-black text-stone-800">{formatPrice(getCartTotal())}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); initiateSubmitOrder() }}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 text-base"
              >
                {loading ? 'Sending...' : 'Send to Kitchen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REQUEST BILL MODAL ===== */}
      {showBillRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowBillRequest(false)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🧾</span>
                </div>
                <h3 className="text-xl font-black text-stone-800">Request Bill?</h3>
                <p className="text-stone-500 text-sm mt-1">Our staff will bring your bill shortly</p>
              </div>

              {/* Bill Summary */}
              <div className="bg-stone-50 rounded-xl p-4 mb-5 border border-stone-200">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-200">
                  <span className="font-bold text-stone-700">Table {urlTableNumber}</span>
                  <span className="text-stone-500 text-sm">{sessionOrders.length} order(s)</span>
                </div>

                {sessionOrders.map((order, idx) => (
                  <div key={idx} className="mb-2 pb-2 border-b border-stone-100 last:border-0 last:pb-0 last:mb-0">
                    <p className="text-xs text-stone-400">Order #{order.order_number}</p>
                    <p className="font-medium text-stone-700">{formatPrice(order.total)}</p>
                  </div>
                ))}

                {getCartCount() > 0 && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 mt-2">
                    <p className="text-xs text-amber-700">⚠️ You have {getCartCount()} items in cart not yet ordered</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-stone-300 mt-3">
                  <span className="text-lg font-black text-stone-800">Total</span>
                  <span className="text-2xl font-black text-emerald-600">{formatPrice(sessionTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBillRequest(false)}
                  className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all"
                >
                  Keep Ordering
                </button>
                <button
                  onClick={handleRequestBill}
                  disabled={loading || sessionOrders.length === 0}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Requesting...' : 'Request Bill'}
                </button>
              </div>
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
              <h2 className="text-lg font-black text-stone-800">Assign Items</h2>
              <button onClick={() => setShowSplitModal(false)} className="text-stone-400 hover:text-stone-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
              <p className="text-[11px] text-amber-700 font-medium">
                Tap items to assign them. Unassigned items will be split equally.
              </p>
            </div>

            <div className="overflow-y-auto max-h-[55vh] p-5">
              {splitPersons.filter(p => p.name.trim()).map((person, pIdx) => (
                <div key={pIdx} className="mb-6">
                  <h3 className="font-bold text-sm text-stone-800 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-black">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    {person.name}
                    <span className="ml-auto text-emerald-600 text-xs font-bold">{formatPrice(getPersonTotal(person.items))}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = menuItems.find(i => i.id === itemId)
                      if (!item) return null
                      const isAssigned = person.items.includes(itemId)
                      const isDisabled = !isAssigned && isItemAssignedElsewhere(pIdx, itemId)

                      return (
                        <button
                          key={itemId}
                          onClick={() => !isDisabled && toggleItemForPerson(pIdx, itemId)}
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all text-sm ${
                            isAssigned
                              ? 'bg-emerald-50 border border-emerald-200'
                              : isDisabled
                                ? 'bg-stone-100 border border-stone-200 opacity-40 cursor-not-allowed'
                                : 'bg-stone-50 border border-transparent hover:bg-stone-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isAssigned ? 'bg-emerald-500 text-white' : isDisabled ? 'bg-stone-300' : 'bg-stone-200'
                          }`}>
                            {isAssigned && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 truncate ${isDisabled ? 'text-stone-400' : 'text-stone-700'}`}>
                            {getItemDisplayName(itemId)} x{qty}
                            {isDisabled && <span className="text-[9px] ml-1 text-amber-500 font-semibold">(taken)</span>}
                          </span>
                          <span className="text-stone-500 text-xs shrink-0">{formatPrice(getItemPrice(itemId) * qty)}</span>
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
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
                    <h3 className="text-lg font-black text-stone-800">{item.name}</h3>
                    <p className="text-stone-500 text-xs">{item.nameJp}</p>
                    <p className="text-stone-400 text-xs mt-1">How spicy would you like it?</p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {spiceLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => selectSpiceLevel(item.id, level)}
                        className={`w-full p-3 rounded-xl border-2 transition-all ${
                          selectedSpiceLevels[item.id] === level
                            ? `${getSpiceColor(level)} border-current shadow-sm`
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getSpiceLevelEmoji(level)}</span>
                            <div className="text-left">
                              <span className="block font-bold text-stone-800 text-sm">{level}</span>
                              <span className="block text-[11px] text-stone-500">{getSpiceLevelJapanese(level)}</span>
                            </div>
                          </div>
                          {selectedSpiceLevels[item.id] === level && (
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
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
                      className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSpiceLevel}
                      disabled={!selectedSpiceLevels[item.id]}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ===== ADD-ON MODAL ===== */}
      {showAddOnModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto animate-slideUp">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item) return null

              return (
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-stone-800">{item.name}</h3>
                    <p className="text-stone-500 text-xs">{item.nameJp}</p>
                    <p className="text-stone-400 text-xs mt-1">Would you like to add extras?</p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {item.addOns?.map((addOn, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border-2 border-sky-100 hover:border-sky-300 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={selectedAddOns[item.id]?.includes(addOn.name) || false}
                          onChange={() => toggleAddOn(item.id, addOn.name)}
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <span className="block font-semibold text-stone-800 text-sm">{addOn.name}</span>
                          {addOn.note && <span className="text-[10px] text-stone-500">{addOn.note}</span>}
                        </div>
                        <span className="font-bold text-emerald-600 text-sm">+{formatPrice(addOn.price)}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-semibold text-sm">Item Total:</span>
                      <span className="text-xl font-black text-emerald-600">{formatPrice(getItemPrice(item.id))}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={skipAddOns}
                      className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all text-sm"
                    >
                      No Add-Ons
                    </button>
                    <button
                      onClick={confirmAddToCart}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-sm"
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

      {/* ===== BEVERAGE SUGGESTION POPUP ===== */}
      {showBeverageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto animate-slideUp">
            <div className="p-5">
              <div className="mb-4 text-center">
                <div className="text-4xl mb-2">🍻</div>
                <h3 className="text-xl font-black text-stone-800">How About a Drink?</h3>
                <p className="text-stone-500 text-sm mt-1">A perfect pairing to complete your meal!</p>
              </div>

              <div className="space-y-3 mb-5">
                {getBeverageSuggestions().map((beverage) => {
                  const emoji = beverage.category === 'margaritas' ? '🍹' : beverage.category === 'cocktails' ? '🍺' : '🥤'
                  const qty = beverageQuantities[beverage.id] || 0
                  return (
                    <div key={beverage.id} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{emoji}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-stone-800">{beverage.name}</h4>
                          <p className="text-xs text-stone-500">{beverage.nameJp}</p>
                          <p className="text-amber-700 font-bold text-sm mt-0.5">{formatPrice(beverage.price)}</p>
                        </div>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                          <button onClick={() => updateBeverageQty(beverage.id, -1)} className="w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-md font-bold text-sm flex items-center justify-center">-</button>
                          <span className="flex-1 text-center font-black text-lg">{qty}</span>
                          <button onClick={() => updateBeverageQty(beverage.id, 1)} className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold text-sm flex items-center justify-center">+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateBeverageQty(beverage.id, 1)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors text-xs"
                        >
                          Add {beverage.name}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { skipBeverages(); handleSubmitOrder() }}
                  className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all text-sm"
                >
                  No Thanks
                </button>
                {Object.values(beverageQuantities).some(q => q > 0) && (
                  <button
                    onClick={() => { addBeverages(); handleSubmitOrder() }}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all text-sm"
                  >
                    Add & Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TableOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/Logo.png" alt="" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-stone-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <TableOrderContent />
    </Suspense>
  )
}

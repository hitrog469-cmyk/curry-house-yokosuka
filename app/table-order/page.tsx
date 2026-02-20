'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatPrice } from '@/lib/utils'
import { menuItems, menuCategories, type MenuItem, type AddOn, needsCurryPairing, needsBreadRicePairing, getCurrySuggestions, getBreadRiceSuggestions } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TodaysSpecialPopup from '@/components/TodaysSpecialPopup'

function TableOrderContent() {
  const searchParams = useSearchParams()
  const urlTableNumber = searchParams.get('table')

  // Session state - track active session for this table
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [tableOccupied, setTableOccupied] = useState(false)
  const [isAddOnMode, setIsAddOnMode] = useState(false)

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

  // Beverage state for the popup
  const [beverageQuantities, setBeverageQuantities] = useState<{[itemId: string]: number}>({})

  // Curry/Bread pairing state
  const [showPairingModal, setShowPairingModal] = useState(false)
  const [pairingType, setPairingType] = useState<'curry' | 'bread_rice'>('curry')
  const [pairingQuantities, setPairingQuantities] = useState<{[itemId: string]: number}>({})

  // Set meal selection state
  const [showSetMealModal, setShowSetMealModal] = useState<string | null>(null)
  const [setMealSelections, setSetMealSelections] = useState<{[setId: string]: {curries: string[], naan: string, rice: string}}>({})
  const [tempSetMealCurries, setTempSetMealCurries] = useState<string[]>([])
  const [tempSetMealNaan, setTempSetMealNaan] = useState<string>('plain-naan')
  const [tempSetMealRice, setTempSetMealRice] = useState<string>('plain-rice')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const supabase = getSupabaseBrowserClient()

  // ========================
  // SESSION CHECK ON LOAD
  // Check if QR table already has an active session
  // ========================
  useEffect(() => {
    if (!urlTableNumber || !supabase) {
      setSessionChecked(true)
      return
    }
    const tableNum = parseInt(urlTableNumber)
    const checkSession = async () => {
      const { data: activeSession } = await supabase
        .from('table_sessions')
        .select('id, customer_name, party_size, status')
        .eq('table_number', tableNum)
        .in('status', ['active', 'bill_requested'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeSession) {
        // Table is occupied - switch to add-on mode
        setSessionId(activeSession.id)
        setTableOccupied(true)
        setIsAddOnMode(true)
        setCustomerName(activeSession.customer_name || '')
        setSelectedTables([tableNum])
        setSetupComplete(true) // Skip setup, go straight to menu
      }
      setSessionChecked(true)
    }
    checkSession()
  }, [urlTableNumber, supabase])

  const categories = menuCategories.filter(c =>
    c.id === 'all' || menuItems.some(item => item.category === c.id)
  )

  // ========================
  // SET MEAL CONFIG
  // ========================
  const setMealConfig: {[setId: string]: {curries: number, hasNaan: boolean, hasRice: boolean}} = {
    'set-1': { curries: 2, hasNaan: true, hasRice: true }, // Cheese Naan Set
    'set-2': { curries: 1, hasNaan: true, hasRice: true }, // 1 Curry Set
    'set-3': { curries: 2, hasNaan: true, hasRice: true }, // Yokosuka Set
    'set-4': { curries: 2, hasNaan: true, hasRice: true }, // CFAY Set
  }

  const availableCurries = menuItems.filter(item =>
    ['vegetable_curry', 'seafood_curry', 'chicken_curry', 'mutton_curry'].includes(item.category)
  )

  const naanOptions = [
    { id: 'plain-naan', name: 'Plain Naan', nameJp: 'プレーンナン' },
    { id: 'butter-naan', name: 'Butter Naan', nameJp: 'バターナン' },
    { id: 'garlic-naan', name: 'Garlic Naan', nameJp: 'ガーリックナン' },
    { id: 'cheese-naan', name: 'Cheese Naan', nameJp: 'チーズナン' },
  ]

  const riceOptions = [
    { id: 'plain-rice', name: 'Plain Rice', nameJp: 'ライス' },
    { id: 'saffron-rice', name: 'Saffron Rice', nameJp: 'サフランライス' },
    { id: 'jeera-rice', name: 'Jeera Rice', nameJp: 'ジーラライス' },
  ]

  const isSetMeal = (itemId: string) => Object.keys(setMealConfig).includes(itemId)

  const openSetMealModal = (setId: string) => {
    setTempSetMealCurries(setMealSelections[setId]?.curries || [])
    setTempSetMealNaan(setMealSelections[setId]?.naan || 'plain-naan')
    setTempSetMealRice(setMealSelections[setId]?.rice || 'plain-rice')
    setShowSetMealModal(setId)
  }

  const toggleSetMealCurry = (curryId: string, maxCurries: number) => {
    setTempSetMealCurries(prev => {
      if (prev.includes(curryId)) {
        return prev.filter(id => id !== curryId)
      } else if (prev.length < maxCurries) {
        return [...prev, curryId]
      }
      return prev
    })
  }

  const confirmSetMealSelection = () => {
    if (!showSetMealModal) return
    const config = setMealConfig[showSetMealModal]
    if (!config) return

    if (tempSetMealCurries.length !== config.curries) {
      alert(`Please select ${config.curries} currie${config.curries > 1 ? 's' : ''}`)
      return
    }

    setSetMealSelections(prev => ({
      ...prev,
      [showSetMealModal]: {
        curries: tempSetMealCurries,
        naan: tempSetMealNaan,
        rice: tempSetMealRice,
      }
    }))

    setCart(prev => ({ ...prev, [showSetMealModal]: (prev[showSetMealModal] || 0) + 1 }))
    setShowSetMealModal(null)
  }

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

  // Check if an item is already assigned to another person (for qty=1 items)
  const isItemAssignedElsewhere = (personIndex: number, itemId: string) => {
    const qty = cart[itemId] || 0
    if (qty > 1) return false // Multiple qty items can be assigned to multiple people
    return splitPersons.some((p, i) => i !== personIndex && p.items.includes(itemId))
  }

  const toggleItemForPerson = (personIndex: number, itemId: string) => {
    const qty = cart[itemId] || 0

    // If qty is 1 and already assigned to someone else, don't allow
    if (qty <= 1 && isItemAssignedElsewhere(personIndex, itemId)) {
      return // Button is disabled anyway, but safety check
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
  // ITEM PRICE CALCULATION (with add-ons & variations)
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

    // Step 0: Check if it's a set meal — show set meal modal
    if (isSetMeal(itemId)) {
      openSetMealModal(itemId)
      return
    }

    // Step 1: Check if spice level is needed
    const needsSpiceLevel = item.spiceLevel || item.category?.includes('curry') || item.category === 'nepalese'
    if (needsSpiceLevel && !selectedSpiceLevels[itemId]) {
      setPendingItemId(itemId)
      setShowSpiceLevelModal(itemId)
      return
    }

    // Step 2: Check if add-ons are available
    if (item.addOns && item.addOns.length > 0) {
      setPendingItemId(itemId)
      setShowAddOnModal(itemId)
      return
    }

    // No special selections needed - add directly
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))

    // Check for curry/bread pairing suggestion
    showPairingSuggestion(item)
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

    // After spice, check for add-ons
    if (item?.addOns && item.addOns.length > 0) {
      setShowAddOnModal(pendingItemId)
    } else {
      setCart(prev => ({ ...prev, [pendingItemId]: (prev[pendingItemId] || 0) + 1 }))
      // Show pairing suggestion
      if (item) showPairingSuggestion(item)
      setPendingItemId(null)
    }
  }

  const confirmAddToCart = () => {
    if (!pendingItemId) return
    const item = menuItems.find(i => i.id === pendingItemId)
    setCart(prev => ({ ...prev, [pendingItemId]: (prev[pendingItemId] || 0) + 1 }))
    setShowAddOnModal(null)
    // Show pairing suggestion
    if (item) showPairingSuggestion(item)
    setPendingItemId(null)
  }

  const skipAddOns = () => {
    if (!pendingItemId) return
    const item = menuItems.find(i => i.id === pendingItemId)
    setSelectedAddOns(prev => {
      const updated = { ...prev }
      delete updated[pendingItemId]
      return updated
    })
    setCart(prev => ({ ...prev, [pendingItemId]: (prev[pendingItemId] || 0) + 1 }))
    setShowAddOnModal(null)
    // Show pairing suggestion
    if (item) showPairingSuggestion(item)
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
    // Always suggest lassi
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
  // CURRY / BREAD PAIRING
  // ========================
  const showPairingSuggestion = (item: MenuItem) => {
    if (needsCurryPairing(item)) {
      setPairingType('curry')
      setPairingQuantities({})
      setShowPairingModal(true)
    } else if (needsBreadRicePairing(item)) {
      setPairingType('bread_rice')
      setPairingQuantities({})
      setShowPairingModal(true)
    }
  }

  const updatePairingQty = (itemId: string, change: number) => {
    setPairingQuantities(prev => {
      const current = prev[itemId] || 0
      const newQty = Math.max(0, current + change)
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: newQty }
    })
  }

  const addPairingItems = () => {
    Object.entries(pairingQuantities).forEach(([itemId, qty]) => {
      if (qty > 0) {
        // For curry items, we need to handle spice level
        const item = menuItems.find(i => i.id === itemId)
        setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + qty }))
      }
    })
    setPairingQuantities({})
    setShowPairingModal(false)
  }

  const skipPairing = () => {
    setPairingQuantities({})
    setShowPairingModal(false)
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

  // Get item display name with variation
  const getItemDisplayName = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return ''
    let name = item.name
    if (item.variations && selectedVariations[itemId] !== undefined) {
      name += ` (${item.variations[selectedVariations[itemId]].name})`
    }
    return name
  }

  // Get item display details for kitchen
  const getItemDetails = (itemId: string) => {
    const details: string[] = []
    if (selectedSpiceLevels[itemId]) {
      details.push(`Spice: ${selectedSpiceLevels[itemId]}`)
    }
    if (selectedAddOns[itemId] && selectedAddOns[itemId].length > 0) {
      details.push(`Add-ons: ${selectedAddOns[itemId].join(', ')}`)
    }
    return details.join(' | ')
  }

  const handleSetupComplete = async () => {
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

    // Create a new table session in Supabase
    if (supabase) {
      const { data: newSession } = await supabase
        .from('table_sessions')
        .insert({
          table_number: selectedTables[0],
          session_token: `tbl${selectedTables[0]}_${Date.now()}`,
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          number_of_splits: splitBill ? splitPersons.filter(p => p.name.trim() !== '').length : 1,
          status: 'active',
        })
        .select('id')
        .single()

      if (newSession) setSessionId(newSession.id)
    }

    setSetupComplete(true)
  }

  // ========================
  // SUBMIT ORDER — with beverage prompt
  // ========================
  const initiateSubmitOrder = () => {
    if (Object.keys(cart).length === 0) return

    // Check if there are any alcoholic drink categories already in cart
    const hasAlcohol = Object.keys(cart).some(id => {
      const item = menuItems.find(i => i.id === id)
      return item?.category === 'cocktails' || item?.category === 'margaritas'
    })

    if (!hasAlcohol) {
      // Show beverage suggestion popup
      setShowBeverageModal(true)
      setShowCart(false)
    } else {
      handleSubmitOrder()
    }
  }

  const handleSubmitOrder = async () => {
    if (Object.keys(cart).length === 0) return
    if (!supabase) { alert('Order system not configured'); return }
    setLoading(true)

    try {
      const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.id === itemId)
        const setSelections = setMealSelections[itemId]
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
            : null,
          // Set meal curry/naan/rice selections for kitchen
          setMealChoices: setSelections ? {
            curries: setSelections.curries.map(cId => menuItems.find(i => i.id === cId)?.name || cId),
            naan: naanOptions.find(n => n.id === setSelections.naan)?.name || 'Plain Naan',
            rice: riceOptions.find(r => r.id === setSelections.rice)?.name || 'Plain Rice',
          } : null
        }
      })

      const totalAmount = getCartTotal()
      const validSplitPersons = splitBill ? splitPersons.filter(p => p.name.trim() !== '') : []
      const numberOfSplits = validSplitPersons.length || 1

      // BILL SPLITTING LOGIC — ensure full bill is covered
      let splitDetails: {name: string, amount: number, items: string[]}[] = []

      if (splitBill && validSplitPersons.length > 0) {
        if (splitType === 'equal') {
          // Equal split - simple division
          const perPerson = Math.ceil(totalAmount / numberOfSplits)
          splitDetails = validSplitPersons.map(person => ({
            name: person.name,
            amount: perPerson,
            items: []
          }))
        } else {
          // By-items split — AUTO-ASSIGN unassigned items
          const allCartItemIds = Object.keys(cart)
          const assignedItems = new Set<string>()
          validSplitPersons.forEach(p => p.items.forEach(id => assignedItems.add(id)))

          const unassignedItems = allCartItemIds.filter(id => !assignedItems.has(id))

          // Distribute unassigned items equally among people
          if (unassignedItems.length > 0) {
            unassignedItems.forEach((itemId, idx) => {
              const personIdx = idx % validSplitPersons.length
              const actualPersonIdx = splitPersons.findIndex(p => p.name === validSplitPersons[personIdx].name)
              if (actualPersonIdx >= 0) {
                setSplitPersons(prev => prev.map((p, i) => {
                  if (i !== actualPersonIdx) return p
                  return { ...p, items: [...p.items, itemId] }
                }))
                // Also update local reference for calculation
                validSplitPersons[personIdx].items.push(itemId)
              }
            })
          }

          // Calculate per-person amounts
          let totalAssigned = 0
          splitDetails = validSplitPersons.map((person, idx) => {
            const personAmount = getPersonTotal(person.items)
            totalAssigned += personAmount
            return {
              name: person.name,
              amount: personAmount,
              items: person.items
            }
          })

          // If there's a rounding difference, add it to the first person
          const diff = totalAmount - totalAssigned
          if (diff !== 0 && splitDetails.length > 0) {
            splitDetails[0].amount += diff
          }
        }
      }

      const tableNumbers = selectedTables.join(', ')

      // Insert into table_orders (kitchen display) only - NOT into orders (delivery)
      const { error: tableError } = await supabase
        .from('table_orders')
        .insert({
          table_number: selectedTables[0],
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          number_of_splits: numberOfSplits,
          items: orderItems,
          total_amount: totalAmount,
          amount_per_split: splitType === 'equal' ? Math.ceil(totalAmount / numberOfSplits) : 0,
          status: 'pending',
          order_type: 'in-house',
          session_id: sessionId,
          is_addon: isAddOnMode,
          notes: `Tables: ${tableNumbers}${isAddOnMode ? ' [ADD-ON]' : ''}${splitBill ? ` | Split (${splitType}): ${validSplitPersons.map(p => p.name).join(', ')}` : ''}`
        })
        .select()

      if (tableError) throw tableError

      // Update session total amount
      if (sessionId) {
        await supabase
          .from('table_sessions')
          .update({ total_amount: totalAmount, updated_at: new Date().toISOString() })
          .eq('id', sessionId)
      }

      setOrderSubmitted(true)
      setCart({})
      setSelectedSpiceLevels({})
      setSelectedAddOns({})
      setSelectedVariations({})
      setIsAddOnMode(true) // All subsequent orders from this session are add-ons

      setTimeout(() => {
        setOrderSubmitted(false)
        // Keep setupComplete=true, keep customerName, keep table, keep sessionId
        // Just reset cart - customer stays in ordering mode for add-ons
      }, 5000)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // SESSION LOADING SCREEN
  // ==========================================
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading table...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // SETUP SCREEN
  // ==========================================
  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        {/* Today's Special Popup - Shows on QR Scan */}
        <TodaysSpecialPopup forceShow={!!urlTableNumber} />

        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto relative z-10">
          {/* Welcome header */}
          <div className="text-center mb-6">
            <img src="/images/Logo.png" alt="The Curry House" className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-black text-gray-900">Welcome to The Curry House!</h1>
            <p className="text-gray-500 text-sm mt-1">We're glad you're here. Let's get your table set up.</p>
          </div>

          <div className="space-y-5">
            {/* Table Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Your Table(s) <span className="text-red-500">*</span>
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
                placeholder="What should we call you?"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-base bg-gray-50 focus:bg-white transition-all focus:shadow-sm"
              />
            </div>

            {/* Number of People */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                How Many Are Dining? <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-base bg-gray-50 focus:bg-white transition-all focus:shadow-sm"
              />
            </div>

            {/* Split Bill Toggle */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-bold text-gray-700">Split the Bill?</span>
                  <span className="block text-xs text-gray-500">Easy split between friends - we'll handle the math!</span>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitType('equal')}
                      className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'equal'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Split Equally
                    </button>
                    <button
                      onClick={() => setSplitType('by-items')}
                      className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'by-items'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Split by Items
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      {splitType === 'equal' ? 'Who\'s splitting?' : 'Add people — assign items while ordering'}
                    </label>
                    {splitPersons.map((person, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateSplitPersonName(index, e.target.value)}
                          placeholder={`Person ${index + 1}`}
                          className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-sm bg-white focus:shadow-sm transition-all"
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
                        You'll assign items to each person while ordering. Any unassigned items will be distributed equally, so no worries — the full bill is always covered!
                      </p>
                    </div>
                  )}

                  {splitType === 'equal' && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs text-green-700">
                        The total bill will be split equally between everyone. Simple and fair!
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
              Let's Start Ordering!
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
          <p className="text-gray-500 mb-5">Your food is being prepared with care. Sit back and relax!</p>

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
                        ? formatPrice(Math.ceil(getCartTotal() / validSplitPersons.length))
                        : formatPrice(getPersonTotal(person.items))
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-6">Thank you for dining with us! Your meal will be ready shortly.</p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setOrderSubmitted(false)
                // Stay in add-on mode — table, name, session all preserved
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-md"
            >
              + Order More Items
            </button>
            <button
              onClick={async () => {
                if (supabase && sessionId) {
                  await supabase
                    .from('table_sessions')
                    .update({ status: 'bill_requested' })
                    .eq('id', sessionId)
                }
                alert('Bill requested! Our staff will be with you shortly. 🙏')
              }}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-md"
            >
              💰 Request Bill
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
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container-custom py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img src="/images/Logo.png" alt="" className="w-8 h-8 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-bold truncate">Table {selectedTables.join(', ')}</h1>
                  <p className="text-gray-400 text-xs truncate">Hi {customerName}! Browse and tap to order.</p>
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
                placeholder="What are you craving? Search here..."
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all focus:shadow-sm"
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

        {/* Category filter */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container-custom py-2">
            <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => { setSelectedCategory(category.id); setSearchQuery('') }}
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

      {/* MENU ITEMS */}
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
                    {/* Image */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                      {imagePath ? (
                        <Image
                          src={imagePath}
                          alt={item.name}
                          fill
                          className="object-cover scale-150"
                          sizes="(max-width: 640px) 112px, 128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
                          <span className="text-4xl">🍛</span>
                        </div>
                      )}
                      {item.isRecommended && (
                        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
                          ⭐ TOP
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.nameJp}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      )}

                      {/* Spice level badge */}
                      {selectedSpiceLevels[item.id] && (
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold border mt-1 ${getSpiceColor(selectedSpiceLevels[item.id])}`}>
                          {getSpiceLevelEmoji(selectedSpiceLevels[item.id])} {selectedSpiceLevels[item.id]}
                        </span>
                      )}

                      {/* Selected add-ons display */}
                      {selectedAddOns[item.id] && selectedAddOns[item.id].length > 0 && (
                        <p className="text-[10px] text-blue-600 mt-0.5 font-medium">
                          + {selectedAddOns[item.id].join(', ')}
                        </p>
                      )}

                      {/* Variation display */}
                      {item.variations && selectedVariations[item.id] !== undefined && (
                        <p className="text-[10px] text-purple-600 mt-0.5 font-medium">
                          {item.variations[selectedVariations[item.id]].name}
                        </p>
                      )}

                      {/* Add-ons & Variations indicators for items not yet in cart */}
                      {!cart[item.id] && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variations && item.variations.length > 0 && (
                            <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold border border-purple-200">
                              {item.variations.length} Options
                            </span>
                          )}
                          {item.addOns && item.addOns.length > 0 && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold border border-blue-200">
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

                      {/* Variations selector (if not in cart yet but has variations) */}
                      {item.variations && item.variations.length > 0 && !cart[item.id] && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.variations.map((v, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectVariation(item.id, idx)}
                              className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all ${
                                (selectedVariations[item.id] ?? 0) === idx
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {v.name} {formatPrice(v.price)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-black text-green-600">{formatPrice(getItemPrice(item.id))}</span>

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

      {/* FIXED BOTTOM BAR */}
      {getCartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 safe-bottom">
          <div className="container-custom py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setShowCart(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
              >
                View Cart ({getCartCount()}) &middot; {formatPrice(getCartTotal())}
              </button>
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
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-black text-gray-900">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 p-1">
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
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 shrink-0">
                      {img ? (
                        <Image src={img} alt={item.name} width={56} height={56} className="w-full h-full object-cover scale-[1.6]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{getItemDisplayName(itemId)}</p>
                      {selectedSpiceLevels[itemId] && (
                        <p className="text-[10px] text-gray-500">{getSpiceLevelEmoji(selectedSpiceLevels[itemId])} {selectedSpiceLevels[itemId]}</p>
                      )}
                      {selectedAddOns[itemId] && selectedAddOns[itemId].length > 0 && (
                        <p className="text-[10px] text-blue-600">+ {selectedAddOns[itemId].join(', ')}</p>
                      )}
                      {setMealSelections[itemId] && (
                        <div className="text-[10px] text-purple-600 mt-0.5">
                          <p>🍛 {setMealSelections[itemId].curries.map(cId => menuItems.find(i => i.id === cId)?.name || cId).join(', ')}</p>
                          <p>🫓 {naanOptions.find(n => n.id === setMealSelections[itemId].naan)?.name || 'Plain Naan'} · {riceOptions.find(r => r.id === setMealSelections[itemId].rice)?.name || 'Plain Rice'}</p>
                        </div>
                      )}
                      <p className="text-sm font-bold text-green-600">{formatPrice(getItemPrice(itemId) * quantity)}</p>
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

            {/* Split summary */}
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
                        ? formatPrice(Math.ceil(getCartTotal() / splitPersons.filter(p => p.name.trim()).length))
                        : formatPrice(getPersonTotal(person.items))
                      }
                    </span>
                  </div>
                ))}
                {splitType === 'by-items' && (() => {
                  const assignedItems = new Set<string>()
                  splitPersons.filter(p => p.name.trim()).forEach(p => p.items.forEach(id => assignedItems.add(id)))
                  const unassignedCount = Object.keys(cart).filter(id => !assignedItems.has(id)).length
                  if (unassignedCount > 0) {
                    return (
                      <p className="text-[10px] text-orange-600 mt-1 font-medium">
                        {unassignedCount} item{unassignedCount > 1 ? 's' : ''} not yet assigned — will be split equally when you order
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            )}

            {/* Cart footer */}
            <div className="p-5 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">Total</span>
                <span className="text-2xl font-black text-gray-900">{formatPrice(getCartTotal())}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); initiateSubmitOrder() }}
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

            <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
              <p className="text-[11px] text-amber-700 font-medium">
                Tap items to assign them. Unassigned items will be split equally among everyone.
              </p>
            </div>

            <div className="overflow-y-auto max-h-[55vh] p-5">
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
                      const isDisabled = !isAssigned && isItemAssignedElsewhere(pIdx, itemId)

                      return (
                        <button
                          key={itemId}
                          onClick={() => !isDisabled && toggleItemForPerson(pIdx, itemId)}
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all text-sm ${
                            isAssigned
                              ? 'bg-green-50 border border-green-200'
                              : isDisabled
                                ? 'bg-gray-100 border border-gray-200 opacity-40 cursor-not-allowed'
                                : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isAssigned ? 'bg-green-500 text-white' : isDisabled ? 'bg-gray-300' : 'bg-gray-200'
                          }`}>
                            {isAssigned && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {isDisabled && (
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 truncate ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                            {getItemDisplayName(itemId)} x{qty}
                            {isDisabled && <span className="text-[9px] ml-1 text-orange-500 font-semibold">(taken)</span>}
                          </span>
                          <span className="text-gray-500 text-xs shrink-0">{formatPrice(getItemPrice(itemId) * qty)}</span>
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
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
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
                    <p className="text-gray-400 text-xs mt-1">How spicy would you like it?</p>
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
                    <h3 className="text-lg font-black text-gray-900">{item.name}</h3>
                    <p className="text-gray-500 text-xs">{item.nameJp}</p>
                    <p className="text-gray-400 text-xs mt-1">Would you like to add extras?</p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {item.addOns?.map((addOn, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={selectedAddOns[item.id]?.includes(addOn.name) || false}
                          onChange={() => toggleAddOn(item.id, addOn.name)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <span className="block font-semibold text-gray-900 text-sm">{addOn.name}</span>
                          {addOn.note && <span className="text-[10px] text-gray-500">{addOn.note}</span>}
                        </div>
                        <span className="font-bold text-green-600 text-sm">+{formatPrice(addOn.price)}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold text-sm">Item Total:</span>
                      <span className="text-xl font-black text-green-600">{formatPrice(getItemPrice(item.id))}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={skipAddOns}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
                    >
                      No Add-Ons
                    </button>
                    <button
                      onClick={confirmAddToCart}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all text-sm"
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

      {/* ===== SET MEAL SELECTION MODAL ===== */}
      {showSetMealModal && (() => {
        const setItem = menuItems.find(i => i.id === showSetMealModal)
        const config = setMealConfig[showSetMealModal]
        if (!setItem || !config) return null

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🍛</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{setItem.name}</h3>
                    <p className="text-green-100 text-sm">{setItem.nameJp}</p>
                    <p className="text-white font-bold text-lg mt-1">{formatPrice(setItem.price)}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Curry Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">
                      Choose {config.curries} Curr{config.curries > 1 ? 'ies' : 'y'}
                    </h4>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                      tempSetMealCurries.length === config.curries
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {tempSetMealCurries.length}/{config.curries} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {availableCurries.map(curry => {
                      const isSelected = tempSetMealCurries.includes(curry.id)
                      const isDisabled = !isSelected && tempSetMealCurries.length >= config.curries

                      return (
                        <button
                          key={curry.id}
                          onClick={() => toggleSetMealCurry(curry.id, config.curries)}
                          disabled={isDisabled}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : isDisabled
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{curry.name}</p>
                            <p className="text-xs text-gray-500 truncate">{curry.nameJp}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Naan Selection */}
                {config.hasNaan && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Choose Your Naan</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {naanOptions.map(naan => (
                        <button
                          key={naan.id}
                          onClick={() => setTempSetMealNaan(naan.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            tempSetMealNaan === naan.id
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          <p className="font-semibold text-sm text-gray-900">{naan.name}</p>
                          <p className="text-xs text-gray-500">{naan.nameJp}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rice Selection */}
                {config.hasRice && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Choose Your Rice</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {riceOptions.map(rice => (
                        <button
                          key={rice.id}
                          onClick={() => setTempSetMealRice(rice.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            tempSetMealRice === rice.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          <p className="font-semibold text-sm text-gray-900">{rice.name}</p>
                          <p className="text-xs text-gray-500">{rice.nameJp}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Set Contents Summary */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-700 text-sm mb-2">Set Includes:</h4>
                  <p className="text-sm text-gray-600">{setItem.description}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t bg-gray-50 shrink-0">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSetMealModal(null)}
                    className="flex-1 py-3.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSetMealSelection}
                    disabled={tempSetMealCurries.length !== config.curries}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-xl transition-all ${
                      tempSetMealCurries.length === config.curries
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Add to Order — {formatPrice(setItem.price)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ===== CURRY / BREAD PAIRING POPUP ===== */}
      {showPairingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto animate-slideUp">
            <div className="p-5">
              <div className="mb-4 text-center">
                <div className="text-4xl mb-2">{pairingType === 'curry' ? '🍛' : '🫓'}</div>
                <h3 className="text-xl font-black text-gray-900">
                  {pairingType === 'curry' ? 'Add a Curry?' : 'Add Naan or Rice?'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {pairingType === 'curry'
                    ? 'Complete your meal with a delicious curry!'
                    : 'Perfect your curry with fresh bread or rice!'}
                </p>
              </div>

              <div className="space-y-3 mb-5">
                {(pairingType === 'curry' ? getCurrySuggestions() : getBreadRiceSuggestions()).map((item) => {
                  const qty = pairingQuantities[item.id] || 0
                  const img = getMenuItemImage(item.id)
                  return (
                    <div key={item.id} className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-3 mb-2">
                        {img ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <Image src={img} alt={item.name} width={48} height={48} className="w-full h-full object-cover scale-[1.5]" />
                          </div>
                        ) : (
                          <span className="text-2xl">{pairingType === 'curry' ? '🍛' : '🫓'}</span>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                          <p className="text-xs text-gray-500">{item.nameJp}</p>
                          <p className="text-orange-700 font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                        </div>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                          <button onClick={() => updatePairingQty(item.id, -1)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-md font-bold text-sm flex items-center justify-center">-</button>
                          <span className="flex-1 text-center font-black text-lg">{qty}</span>
                          <button onClick={() => updatePairingQty(item.id, 1)} className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold text-sm flex items-center justify-center">+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updatePairingQty(item.id, 1)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors text-xs"
                        >
                          Add {item.name}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={skipPairing}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
                >
                  No Thanks
                </button>
                {Object.values(pairingQuantities).some(q => q > 0) && (
                  <button
                    onClick={addPairingItems}
                    className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all text-sm"
                  >
                    Add to Order
                  </button>
                )}
              </div>
            </div>
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
                <h3 className="text-xl font-black text-gray-900">How About a Drink?</h3>
                <p className="text-gray-500 text-sm mt-1">A perfect pairing to complete your meal!</p>
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
                          <h4 className="font-bold text-sm text-gray-900">{beverage.name}</h4>
                          <p className="text-xs text-gray-500">{beverage.nameJp}</p>
                          <p className="text-amber-700 font-bold text-sm mt-0.5">{formatPrice(beverage.price)}</p>
                        </div>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                          <button onClick={() => updateBeverageQty(beverage.id, -1)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-md font-bold text-sm flex items-center justify-center">-</button>
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
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
                >
                  No Thanks, Order Now
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

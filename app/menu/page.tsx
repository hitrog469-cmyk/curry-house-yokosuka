'use client'

import { useEffect, useState, Suspense } from 'react'
import { formatPrice } from '@/lib/utils'
import { menuItems, menuCategories, sortOptions, type MenuItem, type AddOn } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import { useAuth } from '@/contexts/auth-context'

function MenuContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [filteredItems, setFilteredItems] = useState<MenuItem[]>(menuItems)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('default')
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedAddOns, setSelectedAddOns] = useState<{[itemId: string]: string[]}>({})
  const [selectedVariations, setSelectedVariations] = useState<{[itemId: string]: number}>({})
  const [selectedSpiceLevels, setSelectedSpiceLevels] = useState<{[itemId: string]: string}>({})
  const [showAddOnModal, setShowAddOnModal] = useState<string | null>(null)
  const [showSpiceLevelModal, setShowSpiceLevelModal] = useState<string | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [showSuggestedModal, setShowSuggestedModal] = useState<string | null>(null)
  const [suggestedQuantities, setSuggestedQuantities] = useState<{[itemId: string]: number}>({})
  const [showBeverageModal, setShowBeverageModal] = useState<string | null>(null)
  const [beverageQuantities, setBeverageQuantities] = useState<{[itemId: string]: number}>({})

  // Set Meal Selection State
  const [showSetMealModal, setShowSetMealModal] = useState<string | null>(null)
  const [setMealSelections, setSetMealSelections] = useState<{[setId: string]: {curries: string[], naan: string, rice: string}}>({})
  const [tempSetMealCurries, setTempSetMealCurries] = useState<string[]>([])
  const [tempSetMealNaan, setTempSetMealNaan] = useState<string>('plain-naan')
  const [tempSetMealRice, setTempSetMealRice] = useState<string>('plain-rice')

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart')

    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    // Load add-ons, variations, and spice levels from localStorage
    // But validate they match current cart items
    const savedAddOns = localStorage.getItem('selectedAddOns')
    const savedVariations = localStorage.getItem('selectedVariations')
    const savedSpiceLevels = localStorage.getItem('selectedSpiceLevels')

    if (savedAddOns) {
      try {
        const addOns = JSON.parse(savedAddOns)
        // Only keep add-ons for items currently in cart
        const validAddOns: {[key: string]: string[]} = {}
        Object.keys(addOns).forEach(itemId => {
          const cartItem = JSON.parse(savedCart || '{}')
          if (cartItem[itemId]) {
            validAddOns[itemId] = addOns[itemId]
          }
        })
        setSelectedAddOns(validAddOns)
        localStorage.setItem('selectedAddOns', JSON.stringify(validAddOns))
      } catch (e) {
        localStorage.removeItem('selectedAddOns')
      }
    }

    if (savedVariations) {
      try {
        const variations = JSON.parse(savedVariations)
        // Only keep variations for items currently in cart
        const validVariations: {[key: string]: number} = {}
        Object.keys(variations).forEach(itemId => {
          const cartItem = JSON.parse(savedCart || '{}')
          if (cartItem[itemId]) {
            validVariations[itemId] = variations[itemId]
          }
        })
        setSelectedVariations(validVariations)
        localStorage.setItem('selectedVariations', JSON.stringify(validVariations))
      } catch (e) {
        localStorage.removeItem('selectedVariations')
      }
    }

    if (savedSpiceLevels) {
      try {
        const spiceLevels = JSON.parse(savedSpiceLevels)
        // Only keep spice levels for items currently in cart
        const validSpiceLevels: {[key: string]: string} = {}
        Object.keys(spiceLevels).forEach(itemId => {
          const cartItem = JSON.parse(savedCart || '{}')
          if (cartItem[itemId]) {
            validSpiceLevels[itemId] = spiceLevels[itemId]
          }
        })
        setSelectedSpiceLevels(validSpiceLevels)
        localStorage.setItem('selectedSpiceLevels', JSON.stringify(validSpiceLevels))
      } catch (e) {
        localStorage.removeItem('selectedSpiceLevels')
      }
    }

    // Load set meal selections
    const savedSetMeals = localStorage.getItem('setMealSelections')
    if (savedSetMeals) {
      try {
        const setMeals = JSON.parse(savedSetMeals)
        // Only keep selections for set meals currently in cart
        const validSetMeals: {[key: string]: {curries: string[], naan: string, rice: string}} = {}
        Object.keys(setMeals).forEach(setId => {
          const cartItem = JSON.parse(savedCart || '{}')
          if (cartItem[setId]) {
            validSetMeals[setId] = setMeals[setId]
          }
        })
        setSetMealSelections(validSetMeals)
        localStorage.setItem('setMealSelections', JSON.stringify(validSetMeals))
      } catch (e) {
        localStorage.removeItem('setMealSelections')
      }
    }
  }, [])

  useEffect(() => {
    filterAndSortItems()
  }, [selectedCategory, searchTerm, selectedSort])

  function filterAndSortItems() {
    let filtered = menuItems

    // Filter by category
    if (selectedCategory === 'recommended') {
      filtered = filtered.filter(item => item.isRecommended)
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const nameJpMatch = item.nameJp.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower);
        const subcategoryMatch = item.subcategory?.toLowerCase().includes(searchLower);
        const categoryName = menuCategories.find(c => c.id === item.category)?.name.toLowerCase() || '';
        const categoryMatch = categoryName.includes(searchLower);

        // Spice level search
        const spiceMatch = item.spiceLevel?.toLowerCase().includes(searchLower);

        return nameMatch || nameJpMatch || descMatch || subcategoryMatch || categoryMatch || spiceMatch;
      });
    }

    // Sort items
    let sorted = [...filtered]
    switch (selectedSort) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        sorted.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0))
        break
    }

    setFilteredItems(sorted)
  }

  const updateCart = (itemId: string, change: number) => {
    setCart(prev => {
      const newCart = { ...prev }
      const currentQty = newCart[itemId] || 0
      const newQty = currentQty + change

      if (newQty <= 0) {
        delete newCart[itemId]
        // Clear selections when item removed from cart
        setSelectedAddOns(prevAddOns => {
          const newAddOns = { ...prevAddOns }
          delete newAddOns[itemId]
          localStorage.setItem('selectedAddOns', JSON.stringify(newAddOns))
          return newAddOns
        })
        setSelectedVariations(prevVars => {
          const newVars = { ...prevVars }
          delete newVars[itemId]
          localStorage.setItem('selectedVariations', JSON.stringify(newVars))
          return newVars
        })
        setSelectedSpiceLevels(prevLevels => {
          const newLevels = { ...prevLevels }
          delete newLevels[itemId]
          localStorage.setItem('selectedSpiceLevels', JSON.stringify(newLevels))
          return newLevels
        })
      } else {
        newCart[itemId] = newQty
      }

      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
  }

  // Set Meal Configuration - which sets require how many curries
  const setMealConfig: {[setId: string]: {curries: number, hasNaan: boolean, hasRice: boolean}} = {
    'set-1': { curries: 2, hasNaan: true, hasRice: true }, // Cheese Naan Set
    'set-2': { curries: 1, hasNaan: true, hasRice: true }, // 1 Curry Set
    'set-3': { curries: 2, hasNaan: true, hasRice: true }, // Yokosuka Set
    'set-4': { curries: 2, hasNaan: true, hasRice: true }, // CFAY Set
  }

  // Available curries for set meal selection
  const availableCurries = menuItems.filter(item =>
    ['vegetable_curry', 'seafood_curry', 'chicken_curry', 'mutton_curry'].includes(item.category)
  )

  // Available naan options
  const naanOptions = [
    { id: 'plain-naan', name: 'Plain Naan', nameJp: 'プレーンナン' },
    { id: 'butter-naan', name: 'Butter Naan', nameJp: 'バターナン' },
    { id: 'garlic-naan', name: 'Garlic Naan', nameJp: 'ガーリックナン' },
    { id: 'cheese-naan', name: 'Cheese Naan', nameJp: 'チーズナン' },
  ]

  // Available rice options
  const riceOptions = [
    { id: 'plain-rice', name: 'Plain Rice', nameJp: 'ライス' },
    { id: 'saffron-rice', name: 'Saffron Rice', nameJp: 'サフランライス' },
    { id: 'jeera-rice', name: 'Jeera Rice', nameJp: 'ジーラライス' },
  ]

  // Check if item is a set meal
  const isSetMeal = (itemId: string) => Object.keys(setMealConfig).includes(itemId)

  // Open set meal modal
  const openSetMealModal = (setId: string) => {
    setTempSetMealCurries(setMealSelections[setId]?.curries || [])
    setTempSetMealNaan(setMealSelections[setId]?.naan || 'plain-naan')
    setTempSetMealRice(setMealSelections[setId]?.rice || 'plain-rice')
    setShowSetMealModal(setId)
  }

  // Toggle curry in set meal selection
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

  // Confirm set meal selection and add to cart
  const confirmSetMealSelection = () => {
    if (!showSetMealModal) return
    const config = setMealConfig[showSetMealModal]
    if (!config) return

    // Validate selection
    if (tempSetMealCurries.length !== config.curries) {
      alert(`Please select ${config.curries} currie${config.curries > 1 ? 's' : ''}`)
      return
    }

    // Save selection
    setSetMealSelections(prev => {
      const updated = {
        ...prev,
        [showSetMealModal]: {
          curries: tempSetMealCurries,
          naan: tempSetMealNaan,
          rice: tempSetMealRice,
        }
      }
      localStorage.setItem('setMealSelections', JSON.stringify(updated))
      return updated
    })

    // Add to cart
    updateCart(showSetMealModal, 1)
    setShowSetMealModal(null)
  }

  const handleAddToCart = (itemId: string) => {
    // Check if auth is still loading - don't redirect yet
    if (authLoading) {
      return
    }

    // Check if user is logged in
    if (!user) {
      // Redirect to login page
      router.push('/auth/login?redirectTo=/menu')
      return
    }

    const item = menuItems.find(i => i.id === itemId)

    // If it's a set meal, show set meal modal instead
    if (isSetMeal(itemId)) {
      openSetMealModal(itemId)
      return
    }

    // Check if item can have spice level (curry dishes, etc.)
    const needsSpiceLevel = item?.spiceLevel || item?.category === 'curry' || item?.category === 'nepalese'

    // If item needs spice level and doesn't have one selected, show spice modal first
    if (needsSpiceLevel && !selectedSpiceLevels[itemId]) {
      setPendingItemId(itemId)
      setShowSpiceLevelModal(itemId)
      return
    }

    // If item has add-ons, show modal
    if (item?.addOns && item.addOns.length > 0) {
      setPendingItemId(itemId)
      setShowAddOnModal(itemId)
    } else {
      // Add to cart first
      updateCart(itemId, 1)

      // Then check if item has suggested items (like Queso Dip for Chips)
      if (item?.suggestedItems && item.suggestedItems.length > 0) {
        setPendingItemId(itemId)
        setShowSuggestedModal(itemId)
      } else {
        // No suggested items, check for beverage pairing
        const beverageSuggestions = getBeverageSuggestions(itemId)
        if (beverageSuggestions.length > 0) {
          setPendingItemId(itemId)
          setShowBeverageModal(itemId)
        }
      }
    }
  }

  const confirmAddToCart = () => {
    if (pendingItemId) {
      updateCart(pendingItemId, 1)
      setPendingItemId(null)
      setShowAddOnModal(null)

      // Check for suggested items after adding
      const item = menuItems.find(i => i.id === pendingItemId)
      if (item?.suggestedItems && item.suggestedItems.length > 0) {
        setShowSuggestedModal(pendingItemId)
      }
    }
  }

  const skipAddOns = () => {
    if (pendingItemId) {
      // Clear any selected add-ons for this item
      setSelectedAddOns(prev => {
        const updated = { ...prev }
        delete updated[pendingItemId]
        localStorage.setItem('selectedAddOns', JSON.stringify(updated))
        return updated
      })
      updateCart(pendingItemId, 1)
      const tempItemId = pendingItemId
      setPendingItemId(null)
      setShowAddOnModal(null)

      // Check for suggested items after adding
      const item = menuItems.find(i => i.id === tempItemId)
      if (item?.suggestedItems && item.suggestedItems.length > 0) {
        setPendingItemId(tempItemId)
        setShowSuggestedModal(tempItemId)
      } else {
        // No suggested items, check for beverage pairing
        const beverageSuggestions = getBeverageSuggestions(tempItemId)
        if (beverageSuggestions.length > 0) {
          setPendingItemId(tempItemId)
          setShowBeverageModal(tempItemId)
        }
      }
    }
  }

  const addSuggestedItems = () => {
    if (!pendingItemId) return

    const item = menuItems.find(i => i.id === pendingItemId)
    if (item?.suggestedItems) {
      item.suggestedItems.forEach(suggested => {
        const qty = suggestedQuantities[suggested.id] || 1
        updateCart(suggested.id, qty)
      })
    }

    setSuggestedQuantities({})
    setShowSuggestedModal(null)

    // After adding suggested items, check for beverage suggestions
    const suggestions = getBeverageSuggestions(pendingItemId)
    if (suggestions.length > 0) {
      setShowBeverageModal(pendingItemId)
    } else {
      setPendingItemId(null)
    }
  }

  const skipSuggested = () => {
    setSuggestedQuantities({})
    setShowSuggestedModal(null)

    // After skipping suggested items, check for beverage suggestions
    if (pendingItemId) {
      const suggestions = getBeverageSuggestions(pendingItemId)
      if (suggestions.length > 0) {
        setShowBeverageModal(pendingItemId)
      } else {
        setPendingItemId(null)
      }
    } else {
      setPendingItemId(null)
    }
  }

  const updateSuggestedQty = (itemId: string, change: number) => {
    setSuggestedQuantities(prev => {
      const current = prev[itemId] || 1
      const newQty = Math.max(1, current + change)
      return { ...prev, [itemId]: newQty }
    })
  }

  const getItemPrice = (item: MenuItem) => {
    let basePrice = item.price

    // If variation is selected
    if (item.variations && selectedVariations[item.id] !== undefined) {
      basePrice = item.variations[selectedVariations[item.id]].price
    }

    // Add selected add-ons
    if (selectedAddOns[item.id]) {
      item.addOns?.forEach(addOn => {
        if (selectedAddOns[item.id]?.includes(addOn.name)) {
          basePrice += addOn.price
        }
      })
    }

    return basePrice
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = menuItems.find(i => i.id === itemId)
      if (!item) return total
      return total + (getItemPrice(item) * qty)
    }, 0)
  }

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  }

  const getSpiceColor = (level?: string) => {
    if (!level) return ''
    const colors: any = {
      'MILD': 'bg-green-100 text-green-800 border-green-300',
      'NORMAL': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'MEDIUM': 'bg-orange-100 text-orange-800 border-orange-300',
      'HOT': 'bg-red-100 text-red-800 border-red-300',
      'VERY HOT': 'bg-red-200 text-red-900 border-red-400'
    }
    return colors[level] || ''
  }

  const toggleAddOn = (itemId: string, addOnName: string) => {
    setSelectedAddOns(prev => {
      const current = prev[itemId] || []
      const updated = current.includes(addOnName)
        ? current.filter(name => name !== addOnName)
        : [...current, addOnName]
      const newAddOns = { ...prev, [itemId]: updated }
      localStorage.setItem('selectedAddOns', JSON.stringify(newAddOns))
      return newAddOns
    })
  }

  const selectVariation = (itemId: string, variationIndex: number) => {
    setSelectedVariations(prev => {
      const newVars = { ...prev, [itemId]: variationIndex }
      localStorage.setItem('selectedVariations', JSON.stringify(newVars))
      return newVars
    })
  }

  const selectSpiceLevel = (itemId: string, level: string) => {
    setSelectedSpiceLevels(prev => {
      const newLevels = { ...prev, [itemId]: level }
      localStorage.setItem('selectedSpiceLevels', JSON.stringify(newLevels))
      return newLevels
    })
  }

  // Toggle favorite
  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      localStorage.setItem('favorites', JSON.stringify(updated))
      return updated
    })
  }

  const confirmSpiceLevel = () => {
    if (!pendingItemId) return

    setShowSpiceLevelModal(null)

    const item = menuItems.find(i => i.id === pendingItemId)

    // After spice level, check for add-ons
    if (item?.addOns && item.addOns.length > 0) {
      setShowAddOnModal(pendingItemId)
    } else {
      // Add to cart
      updateCart(pendingItemId, 1)

      // Check for suggested items
      if (item?.suggestedItems && item.suggestedItems.length > 0) {
        setShowSuggestedModal(pendingItemId)
      } else {
        setPendingItemId(null)
      }
    }
  }

  const getSpiceLevelEmoji = (level: string) => {
    const emojis: any = {
      'MILD': '🟢',
      'NORMAL': '🟡',
      'MEDIUM': '🟠',
      'HOT': '🔴',
      'VERY HOT': '🔥'
    }
    return emojis[level] || '🌶️'
  }

  const getSpiceLevelJapanese = (level: string) => {
    const japanese: any = {
      'MILD': '甘口',
      'NORMAL': '普通',
      'MEDIUM': '中辛',
      'HOT': '辛口',
      'VERY HOT': '激辛'
    }
    return japanese[level] || ''
  }

  const getBeverageSuggestions = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return []

    const beverageItems: string[] = []

    // Suggest beer for curry dishes
    if (item.category.includes('curry') || item.category === 'nepalese' || item.category === 'sets') {
      beverageItems.push('beer-2', 'beer-3') // Nepal Ice, King Fisher
    }

    // Suggest margaritas/corona for Mexican dishes
    if (item.category === 'mexican' || item.category === 'starters') {
      beverageItems.push('beer-1', 'marg-1') // Corona, Regular Margarita
    }

    // Suggest Asahi for tandoori and fried items
    if (item.category === 'tandoori' || item.category === 'fried') {
      beverageItems.push('beer-4', 'beer-5') // Asahi Draft, Asahi Bottle
    }

    // General suggestions - Lassi for all spicy dishes
    if (item.spiceLevel || beverageItems.length === 0) {
      beverageItems.push('drink-1', 'drink-2') // Lassi, Mango Lassi
    }

    // Get actual menu items
    return menuItems.filter(i => beverageItems.includes(i.id)).slice(0, 3) // Max 3 suggestions
  }

  const addBeverageSuggestions = () => {
    if (!pendingItemId) return

    const suggestions = getBeverageSuggestions(pendingItemId)
    suggestions.forEach(beverage => {
      const qty = beverageQuantities[beverage.id] || 0
      if (qty > 0) {
        // Actually add to cart
        updateCart(beverage.id, qty)
      }
    })

    setBeverageQuantities({})
    setShowBeverageModal(null)
    setPendingItemId(null)
  }

  const skipBeverage = () => {
    setBeverageQuantities({})
    setShowBeverageModal(null)
    setPendingItemId(null)
  }

  const updateBeverageQty = (beverageId: string, change: number) => {
    setBeverageQuantities(prev => {
      const current = prev[beverageId] || 0
      const newQty = Math.max(0, current + change)
      if (newQty === 0) {
        const { [beverageId]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [beverageId]: newQty }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-linear-to-r from-green-600 to-green-700 text-white py-16">
        <div className="container-custom">
          <h1 className="heading-1 mb-4">Our Complete Menu</h1>
          <p className="text-xl text-green-50 mb-2">
            Authentic Indian, Nepalese, Mexican & Japanese-Fusion Cuisine
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="bg-white/20 px-4 py-2 rounded-full font-semibold">
              {menuItems.length} Items Available
            </span>
            <span className="bg-white/20 px-4 py-2 rounded-full font-semibold">
              All Prices Include Tax
            </span>
            <span className="bg-white/20 px-4 py-2 rounded-full font-semibold">
              Delivery Fee Calculated at Checkout
            </span>
          </div>
        </div>
      </div>

      {/* Floating Cart */}
      {getCartCount() > 0 && (
        <Link href="/order">
          <div className="fixed bottom-6 right-6 z-40 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer">
            <div className="relative">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-white text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {getCartCount()}
              </span>
            </div>
            <div>
              <div className="font-bold text-sm">View Cart</div>
              <div className="text-xs">{formatPrice(getCartTotal())}</div>
            </div>
          </div>
        </Link>
      )}

      <div className="container-custom py-8">
        {/* Search & Sort Bar */}
        <div className="mb-8 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search menu items... (English or Japanese)"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-green-500 outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Sort */}
            <div>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:border-green-500 outline-none transition-colors font-semibold"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 -mx-4 px-4 relative">
          {/* Right fade gradient with arrow */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-gray-50 to-transparent pointer-events-none z-10 flex items-center justify-end pr-4">
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
              Scroll →
            </div>
          </div>

          <div className="overflow-x-auto pb-3" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#16a34a #e5e7eb'
          }}>
            <div className="flex gap-3 min-w-max">
              {menuCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all shadow-md ${
                    selectedCategory === cat.id
                      ? 'bg-linear-to-r from-green-600 to-green-700 text-white scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                  <span className="block text-xs mt-1 opacity-80">{cat.nameJp}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchTerm && `Search results for "${searchTerm}"`}
            {!searchTerm && selectedCategory === 'all' && 'All Menu Items'}
            {!searchTerm && selectedCategory === 'recommended' && 'Chef\'s Recommendations'}
            {!searchTerm && selectedCategory !== 'all' && selectedCategory !== 'recommended' &&
              menuCategories.find(c => c.id === selectedCategory)?.name}
            <span className="text-lg text-gray-600 ml-3">
              ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
            </span>
          </h2>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="card text-center py-12 max-w-md mx-auto">
            <p className="text-gray-600 text-xl mb-2">No items found</p>
            <p className="text-gray-500 mb-4">Try a different search or category</p>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('all') }} className="btn-primary">
              View All Items
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} id={`item-${item.id}`} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col relative">
                {/* Top badges row */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
                  {/* Recommended Badge */}
                  {item.isRecommended ? (
                    <span className="bg-orange-500 text-white shadow-lg text-xs px-3 py-1 rounded-full font-bold">
                      CHEF'S PICK
                    </span>
                  ) : <span></span>}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id) }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                      favorites.includes(item.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 backdrop-blur text-stone-400 hover:text-red-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={favorites.includes(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Image - DISH FILLS ENTIRE CARD */}
                <div className="relative w-full h-80 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                  {getMenuItemImage(item.id) ? (
                    <img
                      src={getMenuItemImage(item.id)!}
                      alt={item.name}
                      className="w-full h-full object-cover scale-[1.6] hover:scale-[1.8] transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
                      <span className="text-gray-500 text-sm font-medium bg-white/80 px-4 py-2 rounded-full">
                        Photo Coming Soon
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Spice Level - Show selected or default */}
                  {(item.spiceLevel || selectedSpiceLevels[item.id]) && (
                    <div className="mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getSpiceColor(selectedSpiceLevels[item.id] || item.spiceLevel || '')}`}>
                        {selectedSpiceLevels[item.id] ? `🌶️ ${selectedSpiceLevels[item.id]}` : item.spiceLevel}
                      </span>
                    </div>
                  )}

                  {/* Item Details */}
                  <h3 className="font-bold text-xl mb-1 text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.nameJp}</p>

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Variations */}
                  {item.variations && item.variations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-700 mb-2">Choose Option:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.variations.map((variation, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectVariation(item.id, idx)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                              (selectedVariations[item.id] ?? 0) === idx
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {variation.name} {formatPrice(variation.price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add-ons available indicator */}
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 text-center">
                        ✨ {item.addOns.length} Add-On{item.addOns.length > 1 ? 's' : ''} Available
                      </p>
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1"></div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4 mt-auto">
                    <p className="text-orange-600 font-bold text-3xl">
                      {formatPrice(getItemPrice(item))}
                    </p>
                  </div>

                  {/* Cart Buttons */}
                  {cart[item.id] ? (
                    <div className="flex items-center gap-3 bg-linear-to-r from-gray-100 to-gray-200 rounded-xl p-3 shadow-md">
                      <button
                        onClick={() => updateCart(item.id, -1)}
                        className="w-12 h-12 bg-white hover:bg-gray-50 text-gray-800 font-black text-2xl rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="block font-black text-3xl text-gray-900">{cart[item.id]}</span>
                        <span className="block text-xs text-gray-600 font-semibold">in cart</span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item.id)}
                        className="w-12 h-12 bg-linear-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black text-2xl rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      className="w-full btn-primary"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spice Level Modal */}
      {showSpiceLevelModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item) return null

              const spiceLevels = ['MILD', 'NORMAL', 'MEDIUM', 'HOT', 'VERY HOT']

              return (
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4 text-center">
                    <div className="text-4xl mb-2">🌶️</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Choose Your Spice Level</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.nameJp}</p>
                  </div>

                  {/* Spice Level Options */}
                  <div className="space-y-3 mb-6">
                    {spiceLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => selectSpiceLevel(item.id, level)}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedSpiceLevels[item.id] === level
                            ? `${getSpiceColor(level)} border-current shadow-lg scale-105`
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getSpiceLevelEmoji(level)}</span>
                            <div className="text-left">
                              <span className="block font-bold text-gray-900">{level}</span>
                              <span className="block text-sm text-gray-600">{getSpiceLevelJapanese(level)}</span>
                            </div>
                          </div>
                          {selectedSpiceLevels[item.id] === level && (
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Info Box */}
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 text-center">
                      💡 You can always adjust spice level for each order
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={confirmSpiceLevel}
                    disabled={!selectedSpiceLevels[item.id]}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedSpiceLevels[item.id] ? 'Continue' : 'Select Spice Level'}
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Add-On Modal */}
      {showAddOnModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item) return null

              return (
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.nameJp}</p>
                  </div>

                  {/* Add-Ons Selection */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">Would you like to add extras?</h4>
                    <div className="space-y-3">
                      {item.addOns?.map((addOn, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedAddOns[item.id]?.includes(addOn.name) || false}
                            onChange={() => toggleAddOn(item.id, addOn.name)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <span className="block font-semibold text-gray-900">{addOn.name}</span>
                            {addOn.note && <span className="text-xs text-gray-500">{addOn.note}</span>}
                          </div>
                          <span className="font-bold text-green-600">+{formatPrice(addOn.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Total Price Display */}
                  <div className="mb-6 p-4 bg-linear-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold">Total Price:</span>
                      <span className="text-3xl font-black text-green-600">{formatPrice(getItemPrice(item))}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={skipAddOns}
                      className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
                    >
                      Skip Add-Ons
                    </button>
                    <button
                      onClick={confirmAddToCart}
                      className="flex-1 px-6 py-4 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Suggested Items Modal (like Queso Dip) */}
      {showSuggestedModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item || !item.suggestedItems) return null

              return (
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Also Want to Add?</h3>
                    <p className="text-gray-600 text-sm">Complete your order with these items</p>
                  </div>

                  {/* Suggested Items */}
                  <div className="space-y-4 mb-6">
                    {item.suggestedItems.map((suggested) => (
                      <div key={suggested.id} className="p-4 bg-linear-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900">{suggested.name}</h4>
                            <p className="text-orange-600 font-bold text-xl">+{formatPrice(suggested.price)}</p>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-3 bg-white rounded-lg p-2">
                          <button
                            onClick={() => updateSuggestedQty(suggested.id, -1)}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl flex items-center justify-center transition-colors"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center font-black text-2xl text-gray-900">
                            {suggestedQuantities[suggested.id] || 1}
                          </span>
                          <button
                            onClick={() => updateSuggestedQty(suggested.id, 1)}
                            className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xl flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={skipSuggested}
                      className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
                    >
                      No Thanks
                    </button>
                    <button
                      onClick={addSuggestedItems}
                      className="flex-1 px-6 py-4 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Set Meal Selection Modal */}
      {showSetMealModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {(() => {
              const setItem = menuItems.find(i => i.id === showSetMealModal)
              const config = setMealConfig[showSetMealModal]
              if (!setItem || !config) return null

              return (
                <>
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
                        Add to Cart — {formatPrice(setItem.price)}
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Beverage Pairing Modal */}
      {showBeverageModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item) return null

              const suggestions = getBeverageSuggestions(pendingItemId)
              if (suggestions.length === 0) return null

              return (
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4 text-center">
                    <div className="text-4xl mb-2">🍺</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Perfect Pairing?</h3>
                    <p className="text-gray-600 text-sm mb-2">Enhance your {item.name} with a refreshing drink</p>
                    <p className="text-gray-500 text-xs">✨ Recommended by our chef</p>
                  </div>

                  {/* Beverage Suggestions */}
                  <div className="space-y-3 mb-6">
                    {suggestions.map((beverage) => {
                      const emoji = beverage.category === 'margaritas' ? '🍹' : beverage.category === 'cocktails' ? '🍺' : '🥤'
                      return (
                      <div key={beverage.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{emoji}</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900">{beverage.name}</h4>
                              <p className="text-sm text-gray-600">{beverage.nameJp}</p>
                              <p className="text-blue-600 font-bold text-lg mt-1">{formatPrice(beverage.price)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        {beverageQuantities[beverage.id] !== undefined && beverageQuantities[beverage.id] > 0 ? (
                          <div className="flex items-center gap-3 bg-white rounded-lg p-2">
                            <button
                              onClick={() => updateBeverageQty(beverage.id, -1)}
                              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl flex items-center justify-center transition-colors"
                            >
                              −
                            </button>
                            <span className="flex-1 text-center font-black text-2xl text-gray-900">
                              {beverageQuantities[beverage.id]}
                            </span>
                            <button
                              onClick={() => updateBeverageQty(beverage.id, 1)}
                              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xl flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateBeverageQty(beverage.id, 1)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors"
                          >
                            Add {emoji} {beverage.name}
                          </button>
                        )}
                      </div>
                    )})}
                  </div>

                  {/* Info Box */}
                  <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800 text-center">
                      💡 Perfect pairings enhance your dining experience!
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={skipBeverage}
                      className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
                    >
                      No Thanks
                    </button>
                    {Object.values(beverageQuantities).some(q => q > 0) && (
                      <button
                        onClick={addBeverageSuggestions}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                      >
                        Add Drinks
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MenuContent />
    </Suspense>
  )
}

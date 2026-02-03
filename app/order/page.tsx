'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatPrice } from '@/lib/utils'
import { canPlaceOrder } from '@/lib/restaurant-hours'
import { menuItems } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import RestaurantStatus from '@/components/RestaurantStatus'

// Spice level definitions
const SPICE_LEVELS = [
  { level: 'MILD', label: 'Mild', labelJp: 'マイルド', emoji: '🌶️', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { level: 'NORMAL', label: 'Normal', labelJp: '普通', emoji: '🌶️🌶️', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { level: 'MEDIUM', label: 'Medium', labelJp: '中辛', emoji: '🌶️🌶️🌶️', color: 'bg-orange-200 text-orange-900 border-orange-400' },
  { level: 'HOT', label: 'Hot', labelJp: '辛口', emoji: '🌶️🌶️🌶️🌶️', color: 'bg-red-100 text-red-800 border-red-300' },
  { level: 'VERY HOT', label: 'Very Hot', labelJp: '激辛', emoji: '🔥', color: 'bg-red-200 text-red-900 border-red-400' },
]

export default function OrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState<'cart' | 'details' | 'confirmation'>('cart')
  const [loading, setLoading] = useState(false)

  // Modal states for spice/add-on editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [showSpiceModal, setShowSpiceModal] = useState(false)
  const [showAddOnsModal, setShowAddOnsModal] = useState(false)
  const [tempSpiceLevel, setTempSpiceLevel] = useState<string>('')
  const [tempAddOns, setTempAddOns] = useState<string[]>([])

  // Order confirmation state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string,
    orderNumber: string,
    items: any[],
    total: number,
    customerName: string,
    address: string,
    estimatedTime: string
  } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Order form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  })

  // Promo code and delivery
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0) // Free delivery within 3km

  // Load cart from localStorage
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedAddOns, setSelectedAddOns] = useState<{[itemId: string]: string[]}>({})
  const [selectedVariations, setSelectedVariations] = useState<{[itemId: string]: number}>({})
  const [selectedSpiceLevels, setSelectedSpiceLevels] = useState<{[itemId: string]: string}>({})

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart')
    const savedAddOns = localStorage.getItem('selectedAddOns')
    const savedVariations = localStorage.getItem('selectedVariations')
    const savedSpiceLevels = localStorage.getItem('selectedSpiceLevels')

    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    if (savedAddOns) {
      setSelectedAddOns(JSON.parse(savedAddOns))
    }
    if (savedVariations) {
      setSelectedVariations(JSON.parse(savedVariations))
    }
    if (savedSpiceLevels) {
      setSelectedSpiceLevels(JSON.parse(savedSpiceLevels))
    }
  }, [])

  const updateCart = (itemId: string, change: number) => {
    setCart(prev => {
      const newCart = { ...prev }
      const currentQty = newCart[itemId] || 0
      const newQty = currentQty + change

      if (newQty <= 0) {
        delete newCart[itemId]
        // Clear selections when item removed
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

  const removeItem = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      delete newCart[itemId]
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
    // Clear selections
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
  }

  const getItemPrice = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return 0

    let basePrice = item.price

    // If variation is selected
    if (item.variations && selectedVariations[itemId] !== undefined) {
      basePrice = item.variations[selectedVariations[itemId]].price
    }

    // Add selected add-ons
    if (selectedAddOns[itemId]) {
      item.addOns?.forEach(addOn => {
        if (selectedAddOns[itemId]?.includes(addOn.name)) {
          basePrice += addOn.price
        }
      })
    }

    return basePrice
  }

  const getSubtotal = () => {
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      return sum + (getItemPrice(itemId) * qty)
    }, 0)
  }

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase().trim()
    setPromoError('')

    // Example promo codes
    if (code === 'WELCOME15') {
      setPromoDiscount(15) // 15% discount
      setPromoError('')
    } else if (code === 'FIRST10') {
      setPromoDiscount(10) // 10% discount
      setPromoError('')
    } else if (code === 'SAVE500') {
      setPromoDiscount(500) // Fixed ¥500 discount
      setPromoError('')
    } else if (code === '') {
      setPromoDiscount(0)
      setPromoError('')
    } else {
      setPromoDiscount(0)
      setPromoError('Invalid promo code')
    }
  }

  const removePromoCode = () => {
    setPromoCode('')
    setPromoDiscount(0)
    setPromoError('')
  }

  const getDiscount = () => {
    if (typeof promoDiscount === 'number') {
      if (promoDiscount > 100) {
        // Fixed amount discount
        return Math.min(promoDiscount, getSubtotal())
      } else {
        // Percentage discount
        return Math.round((getSubtotal() * promoDiscount) / 100)
      }
    }
    return 0
  }

  const getTotal = () => {
    return getSubtotal() - getDiscount() + deliveryFee
  }

  const handleSubmitOrder = async () => {
    // Check if restaurant is open
    const orderCheck = canPlaceOrder()
    if (!orderCheck.allowed) {
      alert(`❌ ${orderCheck.message}\n\nPlease check our opening hours and try again later.`)
      return
    }

    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    const orderData: any = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      delivery_address: formData.address,
      items: Object.entries(cart).map(([itemId, qty]) => {
        const item = menuItems.find(i => i.id === itemId)
        return {
          id: itemId,
          name: item?.name || '',
          price: getItemPrice(itemId),
          quantity: qty,
          addOns: selectedAddOns[itemId] || [],
          variation: selectedVariations[itemId],
          spiceLevel: selectedSpiceLevels[itemId] || null
        }
      }),
      total_amount: getTotal(),
      status: 'pending',
      payment_method: 'cod',
      payment_status: 'pending',
      notes: formData.notes,
      order_type: 'delivery'
    }

    // Add user_id if user is logged in
    if (user?.id) {
      orderData.user_id = user.id
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()

    setLoading(false)

    if (error) {
      alert('Error placing order. Please try again.')
      console.error(error)
    } else {
      // Save confirmed order details before clearing cart
      const orderItems = Object.entries(cart).map(([itemId, qty]) => {
        const item = menuItems.find(i => i.id === itemId)
        return {
          id: itemId,
          name: item?.name || '',
          nameJp: item?.nameJp || '',
          price: getItemPrice(itemId),
          quantity: qty,
          addOns: selectedAddOns[itemId] || [],
          spiceLevel: selectedSpiceLevels[itemId] || null
        }
      })

      // Generate order number (use last 6 chars of ID or timestamp-based)
      const orderId = data?.[0]?.id || ''
      const orderNumber = `TCH-${Date.now().toString(36).toUpperCase().slice(-6)}`

      setConfirmedOrder({
        id: orderId,
        orderNumber: orderNumber,
        items: orderItems,
        total: getTotal(),
        customerName: formData.name,
        address: formData.address,
        estimatedTime: '30-45 minutes'
      })

      // Clear cart after successful order
      localStorage.removeItem('cart')
      localStorage.removeItem('selectedAddOns')
      localStorage.removeItem('selectedVariations')
      localStorage.removeItem('selectedSpiceLevels')
      setCart({})
      setSelectedAddOns({})
      setSelectedVariations({})
      setSelectedSpiceLevels({})
      setStep('confirmation')
    }
  }

  const cartItems = Object.keys(cart)

  // Check if item supports spice levels (curries, rice dishes, etc.)
  const itemSupportsSpice = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return false
    const spiceCategories = ['vegetable_curry', 'seafood_curry', 'chicken_curry', 'mutton_curry', 'rice', 'biryani', 'noodles']
    return spiceCategories.includes(item.category) || item.spiceLevel !== undefined
  }

  // Open spice modal for an item
  const openSpiceModal = (itemId: string) => {
    setEditingItemId(itemId)
    setTempSpiceLevel(selectedSpiceLevels[itemId] || 'NORMAL')
    setShowSpiceModal(true)
  }

  // Save spice level
  const saveSpiceLevel = () => {
    if (editingItemId && tempSpiceLevel) {
      setSelectedSpiceLevels(prev => {
        const updated = { ...prev, [editingItemId]: tempSpiceLevel }
        localStorage.setItem('selectedSpiceLevels', JSON.stringify(updated))
        return updated
      })
    }
    setShowSpiceModal(false)
    setEditingItemId(null)
  }

  // Open add-ons modal
  const openAddOnsModal = (itemId: string) => {
    setEditingItemId(itemId)
    setTempAddOns(selectedAddOns[itemId] || [])
    setShowAddOnsModal(true)
  }

  // Save add-ons
  const saveAddOns = () => {
    if (editingItemId) {
      setSelectedAddOns(prev => {
        const updated = { ...prev, [editingItemId]: tempAddOns }
        localStorage.setItem('selectedAddOns', JSON.stringify(updated))
        return updated
      })
    }
    setShowAddOnsModal(false)
    setEditingItemId(null)
  }

  // Toggle add-on in temp state
  const toggleTempAddOn = (addOnName: string) => {
    setTempAddOns(prev =>
      prev.includes(addOnName) ? prev.filter(a => a !== addOnName) : [...prev, addOnName]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/menu" className="text-white hover:text-green-100 mb-4 inline-flex items-center gap-2 font-bold text-lg transition-colors">
            <span className="text-2xl">←</span> Back to Menu
          </Link>
          <h1 className="text-5xl font-black mt-2">
            {step === 'cart' && 'Your Order'}
            {step === 'details' && 'Almost There!'}
            {step === 'confirmation' && 'Order Confirmed!'}
          </h1>
          <p className="text-green-100 mt-2 text-lg">
            {step === 'cart' && 'Great choices! Review your items below.'}
            {step === 'details' && 'Just a few details and your food is on its way.'}
            {step === 'confirmation' && 'Thank you for ordering with us!'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Restaurant Status */}
          <RestaurantStatus />

          {/* STEP 1: Cart */}
          {step === 'cart' && (
            <div className="space-y-6">
              {cartItems.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
                  <Link href="/menu" className="btn-primary inline-block">
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="card">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                    <div className="space-y-4">
                      {cartItems.map((itemId) => {
                        const item = menuItems.find(i => i.id === itemId)
                        if (!item) return null
                        const hasSpice = itemSupportsSpice(itemId)
                        const hasAddOns = item.addOns && item.addOns.length > 0
                        const spiceInfo = SPICE_LEVELS.find(s => s.level === selectedSpiceLevels[itemId])

                        return (
                          <div key={itemId} className="flex flex-col sm:flex-row gap-4 pb-5 border-b last:border-0">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Image - zoomed in */}
                              <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl overflow-hidden flex-shrink-0">
                                {getMenuItemImage(itemId) ? (
                                  <img
                                    src={getMenuItemImage(itemId)!}
                                    alt={item.name}
                                    className="w-full h-full object-cover scale-[1.6]"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-3xl">🍽️</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                <p className="text-gray-500 text-sm">{item.nameJp}</p>

                                {/* Customization badges */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {/* Spice Level */}
                                  {hasSpice && (
                                    <button
                                      onClick={() => openSpiceModal(itemId)}
                                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all hover:shadow-sm ${
                                        spiceInfo ? spiceInfo.color : 'bg-gray-100 text-gray-600 border-gray-300'
                                      }`}
                                    >
                                      {spiceInfo ? spiceInfo.emoji : '🌶️'}
                                      <span>{spiceInfo ? spiceInfo.label : 'Set Spice'}</span>
                                      <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  )}

                                  {/* Add-ons */}
                                  {hasAddOns && (
                                    <button
                                      onClick={() => openAddOnsModal(itemId)}
                                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all hover:shadow-sm ${
                                        selectedAddOns[itemId]?.length > 0
                                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                                          : 'bg-gray-100 text-gray-600 border-gray-300'
                                      }`}
                                    >
                                      ➕
                                      <span>
                                        {selectedAddOns[itemId]?.length > 0
                                          ? `${selectedAddOns[itemId].length} Add-on${selectedAddOns[itemId].length > 1 ? 's' : ''}`
                                          : 'Add-ons'}
                                      </span>
                                      <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  )}
                                </div>

                                {/* Selected add-ons list */}
                                {selectedAddOns[itemId]?.length > 0 && (
                                  <div className="text-xs text-purple-700 mt-1.5">
                                    + {selectedAddOns[itemId].join(', ')}
                                  </div>
                                )}

                                <p className="text-green-600 font-bold text-lg mt-2">
                                  {formatPrice(getItemPrice(itemId))}
                                </p>
                              </div>
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1.5">
                                <button
                                  onClick={() => updateCart(itemId, -1)}
                                  className="w-9 h-9 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                                >
                                  −
                                </button>
                                <span className="min-w-[2.5rem] text-center font-black text-xl text-gray-900">{cart[itemId]}</span>
                                <button
                                  onClick={() => updateCart(itemId, 1)}
                                  className="w-9 h-9 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(itemId)}
                                className="w-9 h-9 text-red-500 hover:text-white hover:bg-red-500 rounded-lg font-bold text-lg flex items-center justify-center transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add More Items Button */}
                    <div className="mt-6 pt-6 border-t">
                      <Link
                        href="/menu"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-2xl">+</span>
                        <span>Add More Items</span>
                      </Link>
                    </div>

                    {/* Promo Code Section */}
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-bold mb-3">Have a Promo Code?</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="ENTER CODE"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white uppercase font-semibold transition-all focus:shadow-sm"
                          disabled={promoDiscount > 0}
                        />
                        {promoDiscount > 0 ? (
                          <button
                            onClick={removePromoCode}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-md"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={applyPromoCode}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-md"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                      {promoDiscount > 0 && (
                        <p className="text-green-600 text-sm mt-2 font-semibold">✓ Promo code applied!</p>
                      )}
                    </div>

                    {/* Order Total */}
                    <div className="mt-6 pt-6 border-t space-y-3 text-lg">
                      <div className="flex justify-between text-gray-700">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-bold">{formatPrice(getSubtotal())}</span>
                      </div>
                      {getDiscount() > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="font-semibold">Discount:</span>
                          <span className="font-bold">-{formatPrice(getDiscount())}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-green-600">
                        <span className="font-semibold">Delivery Fee:</span>
                        <span className="font-bold">FREE ✓</span>
                      </div>
                      <div className="flex justify-between text-2xl font-black text-gray-900 pt-3 border-t-2">
                        <span>Total:</span>
                        <span className="text-orange-600">{formatPrice(getTotal())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => setStep('details')}
                    className="w-full btn-primary text-lg py-5"
                  >
                    Continue to Delivery Details →
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2: Delivery Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-2">Where Should We Deliver?</h2>
                <p className="text-gray-500 text-sm mb-6">We'll have your food ready and at your door as fast as we can.</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all focus:shadow-sm"
                      placeholder="What's your name?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all focus:shadow-sm"
                      placeholder="090-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Delivery Address *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all focus:shadow-sm resize-none"
                      rows={3}
                      placeholder="Full address including building name, room number etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Special Instructions (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50 focus:bg-white transition-all focus:shadow-sm resize-none"
                      rows={3}
                      placeholder="Gate code, extra spice, ring doorbell twice... anything helps!"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('cart')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition-colors text-lg"
                >
                  ← Back to Cart
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="flex-1 btn-primary text-lg py-4"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 'confirmation' && confirmedOrder && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="card text-center py-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-black text-green-700 mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 text-lg">
                  Thank you, {confirmedOrder.customerName}! Your food is being prepared.
                </p>
              </div>

              {/* Order Details Card (Receipt Style) */}
              <div className="card">
                <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Order Number</p>
                      <p className="text-2xl font-black text-gray-900">{confirmedOrder.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Estimated Time</p>
                      <p className="text-lg font-bold text-green-600">🚗 {confirmedOrder.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Delivering To</p>
                  <p className="font-semibold text-gray-900">{confirmedOrder.address}</p>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 mb-3">Your Order</h3>
                  <div className="space-y-3">
                    {confirmedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{item.quantity}x</span>
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.nameJp}</p>
                          {item.spiceLevel && (
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold mt-1">
                              🌶️ {item.spiceLevel}
                            </span>
                          )}
                          {item.addOns && item.addOns.length > 0 && (
                            <p className="text-xs text-purple-600 mt-0.5">+ {item.addOns.join(', ')}</p>
                          )}
                        </div>
                        <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t-2 border-dashed border-gray-300 pt-4">
                  <div className="flex justify-between text-green-600 mb-2">
                    <span className="font-semibold">Delivery Fee</span>
                    <span className="font-bold">FREE ✓</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black">
                    <span>Total Paid</span>
                    <span className="text-green-700">{formatPrice(confirmedOrder.total)}</span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400">The Curry House Yokosuka</p>
                  <p className="text-xs text-gray-400">Thank you for your order!</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/my-orders" className="flex-1 btn-primary text-center py-4">
                  📍 Track Your Order
                </Link>
                <Link href="/menu" className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-xl transition-colors text-center">
                  🍛 Order More
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spice Level Modal */}
      {showSpiceModal && editingItemId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-slideInUp">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-5">
              <h3 className="text-xl font-bold">How Spicy Would You Like It?</h3>
              <p className="text-red-100 text-sm mt-1">
                {menuItems.find(i => i.id === editingItemId)?.name}
              </p>
            </div>

            <div className="p-5 space-y-3">
              {SPICE_LEVELS.map((spice) => (
                <button
                  key={spice.level}
                  onClick={() => setTempSpiceLevel(spice.level)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    tempSpiceLevel === spice.level
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <span className="text-2xl w-12 text-center">{spice.emoji}</span>
                  <div className="flex-1 text-left">
                    <span className="font-bold text-gray-900">{spice.label}</span>
                    <span className="text-gray-500 text-sm ml-2">{spice.labelJp}</span>
                  </div>
                  {tempSpiceLevel === spice.level && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => { setShowSpiceModal(false); setEditingItemId(null); }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSpiceLevel}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-ons Modal */}
      {showAddOnsModal && editingItemId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-slideInUp max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 shrink-0">
              <h3 className="text-xl font-bold">Customize Your Dish</h3>
              <p className="text-purple-100 text-sm mt-1">
                {menuItems.find(i => i.id === editingItemId)?.name}
              </p>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {menuItems.find(i => i.id === editingItemId)?.addOns?.map((addOn) => (
                <button
                  key={addOn.name}
                  onClick={() => toggleTempAddOn(addOn.name)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    tempAddOns.includes(addOn.name)
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                    tempAddOns.includes(addOn.name)
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {tempAddOns.includes(addOn.name) && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-bold text-gray-900">{addOn.name}</span>
                  </div>
                  <span className="text-green-600 font-bold">+{formatPrice(addOn.price)}</span>
                </button>
              ))}
            </div>

            <div className="p-5 pt-3 border-t bg-gray-50 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Selected add-ons:</span>
                <span className="font-bold text-purple-600">
                  {tempAddOns.length > 0 ? `${tempAddOns.length} item${tempAddOns.length > 1 ? 's' : ''}` : 'None'}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddOnsModal(false); setEditingItemId(null); }}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAddOns}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

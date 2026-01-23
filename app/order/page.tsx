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
import AddressInput from '@/components/AddressInput'

export default function OrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState<'cart' | 'details' | 'confirmation'>('cart')
  const [loading, setLoading] = useState(false)

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
  const [deliveryFee, setDeliveryFee] = useState(500) // Default ¥500

  // Load cart from localStorage
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedAddOns, setSelectedAddOns] = useState<{[itemId: string]: string[]}>({})
  const [selectedVariations, setSelectedVariations] = useState<{[itemId: string]: number}>({})

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart')
    const savedAddOns = localStorage.getItem('selectedAddOns')
    const savedVariations = localStorage.getItem('selectedVariations')

    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    if (savedAddOns) {
      setSelectedAddOns(JSON.parse(savedAddOns))
    }
    if (savedVariations) {
      setSelectedVariations(JSON.parse(savedVariations))
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
          variation: selectedVariations[itemId]
        }
      }),
      total_amount: getTotal(),
      status: 'pending',
      payment_method: 'cod',
      payment_status: 'pending',
      notes: formData.notes,
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
      // Clear cart after successful order
      localStorage.removeItem('cart')
      localStorage.removeItem('selectedAddOns')
      localStorage.removeItem('selectedVariations')
      setCart({})
      setSelectedAddOns({})
      setSelectedVariations({})
      setStep('confirmation')
    }
  }

  const cartItems = Object.keys(cart)

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
            {step === 'details' && 'Delivery Details'}
            {step === 'confirmation' && 'Order Confirmed!'}
          </h1>
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

                        return (
                          <div key={itemId} className="flex items-center gap-4 pb-4 border-b last:border-0">
                            {/* Image */}
                            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {getMenuItemImage(itemId) ? (
                                <img
                                  src={getMenuItemImage(itemId)!}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">Photo</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                              <p className="text-gray-500 text-sm">{item.nameJp}</p>
                              <p className="text-orange-600 font-bold mt-1">
                                {formatPrice(getItemPrice(itemId))}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                              <button
                                onClick={() => updateCart(itemId, -1)}
                                className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold text-xl flex items-center justify-center transition-colors shadow-md"
                              >
                                −
                              </button>
                              <span className="min-w-[3rem] text-center font-black text-2xl text-gray-900 px-2">{cart[itemId]}</span>
                              <button
                                onClick={() => updateCart(itemId, 1)}
                                className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xl flex items-center justify-center transition-colors shadow-md"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(itemId)}
                              className="text-red-500 hover:text-red-700 font-bold px-3 text-2xl"
                            >
                              ✕
                            </button>
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
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase font-semibold"
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
                      <div className="flex justify-between text-gray-700">
                        <span className="font-semibold">Delivery Fee:</span>
                        <span className="font-bold">{formatPrice(deliveryFee)}</span>
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
                <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="090-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Delivery Address *</label>
                    <AddressInput
                      value={formData.address}
                      onChange={(address) => setFormData({...formData, address})}
                      onDeliveryFeeCalculated={(fee) => setDeliveryFee(fee)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Special Instructions (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special requests or delivery instructions"
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
          {step === 'confirmation' && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4 text-green-600">Order Placed Successfully!</h2>
              <p className="text-gray-600 text-lg mb-8">
                Thank you for your order. We'll start preparing it right away!
              </p>
              <div className="space-y-4">
                <Link href="/my-orders" className="btn-primary inline-block">
                  Track Your Order
                </Link>
                <br />
                <Link href="/menu" className="text-green-600 hover:text-green-700 font-bold">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

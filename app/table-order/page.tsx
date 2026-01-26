'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatPrice } from '@/lib/utils'
import { menuItems } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TableOrderContent() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('table') || '1'

  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedSpiceLevels, setSelectedSpiceLevels] = useState<{[itemId: string]: string}>({})
  const [showSpiceLevelModal, setShowSpiceLevelModal] = useState<string | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory)

  const addToCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)

    // Check if item needs spice level
    const needsSpiceLevel = item?.spiceLevel || item?.category === 'curry' || item?.category === 'nepalese'

    // If item needs spice level and doesn't have one selected, show modal first
    if (needsSpiceLevel && !selectedSpiceLevels[itemId]) {
      setPendingItemId(itemId)
      setShowSpiceLevelModal(itemId)
      return
    }

    // Add to cart
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
        // Clear spice level when item fully removed
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

    // Add to cart
    setCart(prev => ({
      ...prev,
      [pendingItemId]: (prev[pendingItemId] || 0) + 1
    }))

    setPendingItemId(null)
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

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(i => i.id === itemId)
      return total + (item?.price || 0) * quantity
    }, 0)
  }

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
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

      const { data: tableOrderData, error: tableError } = await supabase
        .from('table_orders')
        .insert({
          table_number: parseInt(tableNumber),
          items: orderItems,
          total_amount: getCartTotal(),
          status: 'pending',
          order_type: 'in-house'
        })
        .select()

      if (tableError) throw tableError

      // Also create in main orders table for admin revenue tracking
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: getCartTotal(),
          status: 'pending',
          order_type: 'in-house',
          table_number: parseInt(tableNumber),
          items: orderItems,
          payment_status: 'pending',
          delivery_address: `Table ${tableNumber} - In-House Dining`
        })

      if (orderError) console.error('Failed to sync to orders table:', orderError)

      setOrderSubmitted(true)
      setCart({})

      // Reset after 3 seconds
      setTimeout(() => {
        setOrderSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl mb-6">✅</div>
          <h1 className="text-4xl font-bold text-white mb-4">Order Sent to Kitchen!</h1>
          <p className="text-2xl text-white/90 mb-2">Table {tableNumber}</p>
          <p className="text-white/80">Your delicious food will arrive soon...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-6 sticky top-0 z-40 shadow-lg">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Table {tableNumber}</h1>
              <p className="text-green-100 text-sm">Scan • Order • Enjoy</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{formatPrice(getCartTotal())}</div>
              <div className="text-sm text-green-100">{getCartCount()} items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b sticky top-20 z-30">
        <div className="container-custom py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container-custom py-6">
        <div className="grid gap-4">
          {filteredItems.map(item => {
            const quantity = cart[item.id] || 0
            const imagePath = getMenuItemImage(item.id) || '/images/placeholder-dish.jpg'

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={imagePath}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>

                    {/* Show selected spice level if item is in cart */}
                    {selectedSpiceLevels[item.id] && (
                      <div className="mt-1">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-bold border ${getSpiceColor(selectedSpiceLevels[item.id])}`}>
                          🌶️ {selectedSpiceLevels[item.id]}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">{formatPrice(item.price)}</span>

                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition-all"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-green-50 rounded-lg p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="bg-white hover:bg-gray-100 text-green-600 font-bold w-8 h-8 rounded-lg transition-all"
                          >
                            -
                          </button>
                          <span className="text-lg font-bold text-green-600 w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="bg-white hover:bg-gray-100 text-green-600 font-bold w-8 h-8 rounded-lg transition-all"
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
      </div>

      {/* Fixed Bottom Cart Button */}
      {getCartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50">
          <div className="container-custom py-4">
            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Sending to Kitchen...' : `Send Order to Kitchen • ${formatPrice(getCartTotal())}`}
            </button>
          </div>
        </div>
      )}

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
                    {selectedSpiceLevels[item.id] ? 'Add to Order' : 'Select Spice Level'}
                  </button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TableOrderContent />
    </Suspense>
  )
}

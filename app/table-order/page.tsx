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
  const urlTableNumber = searchParams.get('table')

  // Order setup state
  const [setupComplete, setSetupComplete] = useState(false)
  const [tableNumber, setTableNumber] = useState(urlTableNumber || '')
  const [customerName, setCustomerName] = useState('')
  const [partySize, setPartySize] = useState('1')
  const [splitBill, setSplitBill] = useState(false)
  const [numberOfSplits, setNumberOfSplits] = useState('1')

  // Ordering state
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

  const handleSetupComplete = () => {
    if (!tableNumber || !customerName || !partySize) {
      alert('Please fill in all required fields')
      return
    }

    if (splitBill && parseInt(numberOfSplits) > parseInt(partySize)) {
      alert('Number of splits cannot exceed party size')
      return
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
      const amountPerSplit = splitBill && numberOfSplits
        ? totalAmount / parseInt(numberOfSplits)
        : totalAmount

      // Create main order with customer info and bill splitting
      const { data: tableOrderData, error: tableError } = await supabase
        .from('table_orders')
        .insert({
          table_number: parseInt(tableNumber),
          customer_name: customerName,
          party_size: parseInt(partySize),
          split_bill: splitBill,
          number_of_splits: splitBill ? parseInt(numberOfSplits) : 1,
          items: orderItems,
          total_amount: totalAmount,
          amount_per_split: amountPerSplit,
          status: 'pending',
          order_type: 'in-house'
        })
        .select()

      if (tableError) throw tableError

      // Also create in main orders table for admin revenue tracking
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: totalAmount,
          status: 'pending',
          order_type: 'in-house',
          table_number: parseInt(tableNumber),
          customer_name: customerName,
          party_size: parseInt(partySize),
          split_bill: splitBill,
          number_of_splits: splitBill ? parseInt(numberOfSplits) : 1,
          items: orderItems,
          payment_status: 'pending',
          delivery_address: `Table ${tableNumber} - ${customerName} (Party of ${partySize})`
        })

      if (orderError) console.error('Failed to sync to orders table:', orderError)

      setOrderSubmitted(true)
      setCart({})
      setSelectedSpiceLevels({})

      // Reset after 5 seconds
      setTimeout(() => {
        setOrderSubmitted(false)
        setSetupComplete(false)
        setCustomerName('')
        setPartySize('1')
        setSplitBill(false)
        setNumberOfSplits('1')
      }, 5000)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Setup screen
  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📱</div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600">Set up your table order</p>
          </div>

          <div className="space-y-4">
            {/* Table Number Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Table Number *
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-semibold"
                required
              >
                <option value="">Select Table</option>
                {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Table {num}</option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Rohit Acharya"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-lg"
                required
              />
            </div>

            {/* Party Size */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Number of People *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-lg"
                required
              />
            </div>

            {/* Split Bill Option */}
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-bold text-gray-700">Split Bill?</span>
                  <span className="block text-xs text-gray-500">Divide payment among guests</span>
                </div>
                <input
                  type="checkbox"
                  checked={splitBill}
                  onChange={(e) => setSplitBill(e.target.checked)}
                  className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                />
              </label>

              {splitBill && (
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Number of Separate Bills
                  </label>
                  <input
                    type="number"
                    min="2"
                    max={partySize}
                    value={numberOfSplits}
                    onChange={(e) => setNumberOfSplits(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Each person will pay {formatPrice(0)} (calculated after order)
                  </p>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleSetupComplete}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg"
            >
              Start Ordering 🍽️
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Order confirmation screen
  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md shadow-2xl">
          <div className="text-8xl mb-6">✅</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Sent to Kitchen!</h1>
          <div className="space-y-2 text-gray-700 mb-6">
            <p className="text-2xl font-bold text-green-600">Table {tableNumber}</p>
            <p className="text-lg">{customerName}</p>
            <p className="text-sm text-gray-500">Party of {partySize}</p>
            {splitBill && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-2">💳 Split Bill</p>
                <p className="text-xs text-blue-800">
                  {numberOfSplits} separate bills • {formatPrice(getCartTotal() / parseInt(numberOfSplits))} each
                </p>
              </div>
            )}
          </div>
          <p className="text-gray-600">Your delicious food will arrive soon...</p>
        </div>
      </div>
    )
  }

  // Main ordering screen
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4 sm:py-6 sticky top-0 z-40 shadow-lg">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Table {tableNumber}</h1>
              <p className="text-green-100 text-xs sm:text-sm">{customerName} • Party of {partySize}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">{formatPrice(getCartTotal())}</div>
              <div className="text-xs sm:text-sm text-green-100">{getCartCount()} items</div>
              {splitBill && (
                <div className="text-xs text-green-200 mt-1">
                  {formatPrice(getCartTotal() / parseInt(numberOfSplits))} / person
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b sticky top-16 sm:top-20 z-30">
        <div className="container-custom py-3 sm:py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all text-sm sm:text-base ${
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
      <div className="container-custom py-4 sm:py-6">
        <div className="grid gap-3 sm:gap-4">
          {filteredItems.map(item => {
            const quantity = cart[item.id] || 0
            const imagePath = getMenuItemImage(item.id) || '/images/placeholder-dish.jpg'

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    <Image
                      src={imagePath}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{item.description}</p>

                    {/* Show selected spice level if item is in cart */}
                    {selectedSpiceLevels[item.id] && (
                      <div className="mt-1">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-bold border ${getSpiceColor(selectedSpiceLevels[item.id])}`}>
                          🌶️ {selectedSpiceLevels[item.id]}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg sm:text-xl font-bold text-green-600">{formatPrice(item.price)}</span>

                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 sm:px-6 py-2 rounded-lg transition-all text-sm sm:text-base"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 sm:gap-3 bg-green-50 rounded-lg p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="bg-white hover:bg-gray-100 text-green-600 font-bold w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all text-sm sm:text-base"
                          >
                            -
                          </button>
                          <span className="text-base sm:text-lg font-bold text-green-600 w-6 sm:w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="bg-white hover:bg-gray-100 text-green-600 font-bold w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all text-sm sm:text-base"
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
          <div className="container-custom py-3 sm:py-4">
            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Sending to Kitchen...' : `Send Order to Kitchen • ${formatPrice(getCartTotal())}`}
            </button>
          </div>
        </div>
      )}

      {/* Spice Level Modal */}
      {showSpiceLevelModal && pendingItemId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const item = menuItems.find(i => i.id === pendingItemId)
              if (!item) return null

              const spiceLevels = ['MILD', 'NORMAL', 'MEDIUM', 'HOT', 'VERY HOT']

              return (
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="mb-4 text-center">
                    <div className="text-4xl mb-2">🌶️</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Choose Your Spice Level</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.nameJp}</p>
                  </div>

                  {/* Spice Level Options */}
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {spiceLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => selectSpiceLevel(item.id, level)}
                        className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          selectedSpiceLevels[item.id] === level
                            ? `${getSpiceColor(level)} border-current shadow-lg scale-105`
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl">{getSpiceLevelEmoji(level)}</span>
                            <div className="text-left">
                              <span className="block font-bold text-gray-900 text-sm sm:text-base">{level}</span>
                              <span className="block text-xs sm:text-sm text-gray-600">{getSpiceLevelJapanese(level)}</span>
                            </div>
                          </div>
                          {selectedSpiceLevels[item.id] === level && (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Info Box */}
                  <div className="mb-4 sm:mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 text-center">
                      💡 You can always adjust spice level for each order
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={confirmSpiceLevel}
                    disabled={!selectedSpiceLevels[item.id]}
                    className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

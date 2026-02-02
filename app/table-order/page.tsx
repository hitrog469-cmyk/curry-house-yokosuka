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
  const [selectedTables, setSelectedTables] = useState<number[]>(urlTableNumber ? [parseInt(urlTableNumber)] : [])
  const [customerName, setCustomerName] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('1')
  const [splitBill, setSplitBill] = useState(false)
  const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal')
  const [splitPersons, setSplitPersons] = useState<{name: string, amount: string}[]>([{name: '', amount: ''}])

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

  const toggleTable = (tableNum: number) => {
    setSelectedTables(prev =>
      prev.includes(tableNum)
        ? prev.filter(t => t !== tableNum)
        : [...prev, tableNum]
    )
  }

  const addSplitPerson = () => {
    setSplitPersons(prev => [...prev, {name: '', amount: ''}])
  }

  const removeSplitPerson = (index: number) => {
    setSplitPersons(prev => prev.filter((_, i) => i !== index))
  }

  const updateSplitPerson = (index: number, field: 'name' | 'amount', value: string) => {
    setSplitPersons(prev => prev.map((p, i) => i === index ? {...p, [field]: value} : p))
  }

  const addToCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    const needsSpiceLevel = item?.spiceLevel || item?.category === 'curry' || item?.category === 'nepalese'

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
      if (validPersons.length > parseInt(numberOfPeople)) {
        alert('Number of people for bill split cannot exceed party size')
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
      const amountPerSplit = totalAmount / numberOfSplits

      const tableNumbers = selectedTables.join(', ')

      // Create main order with customer info and bill splitting
      const { data: tableOrderData, error: tableError } = await supabase
        .from('table_orders')
        .insert({
          table_number: selectedTables[0], // Primary table
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          number_of_splits: numberOfSplits,
          items: orderItems,
          total_amount: totalAmount,
          amount_per_split: amountPerSplit,
          status: 'pending',
          order_type: 'in-house',
          notes: `Tables: ${tableNumbers}${splitBill ? ` | Split between: ${validSplitPersons.map(p => p.name).join(', ')}` : ''}`
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
          table_number: selectedTables[0],
          customer_name: customerName,
          party_size: parseInt(numberOfPeople),
          split_bill: splitBill,
          number_of_splits: numberOfSplits,
          items: orderItems,
          payment_status: 'pending',
          delivery_address: `Tables: ${tableNumbers} - ${customerName} (${numberOfPeople} ${parseInt(numberOfPeople) === 1 ? 'person' : 'people'})`,
          notes: splitBill ? `Split bill: ${validSplitPersons.map(p => p.name).join(', ')}` : ''
        })

      if (orderError) console.error('Failed to sync to orders table:', orderError)

      setOrderSubmitted(true)
      setCart({})
      setSelectedSpiceLevels({})

      // Reset after 5 seconds
      setTimeout(() => {
        setOrderSubmitted(false)
        setSetupComplete(false)
        setSelectedTables([])
        setCustomerName('')
        setNumberOfPeople('1')
        setSplitBill(false)
        setSplitPersons([{name: '', amount: ''}])
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-5xl sm:text-6xl mb-4">🍽️</div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Table Order Setup</h1>
            <p className="text-gray-600">The Curry House Yokosuka</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-center text-green-800 font-semibold">
              Thank you for choosing The Curry House Yokosuka!
              We're delighted to serve you today. 🙏
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Table Selection - Multiple */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Table(s) * <span className="text-xs font-normal text-gray-500">(You can select multiple tables)</span>
              </label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => toggleTable(num)}
                    className={`p-3 rounded-lg font-bold transition-all text-sm sm:text-base ${
                      selectedTables.includes(num)
                        ? 'bg-green-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {selectedTables.length > 0 && (
                <p className="text-xs text-green-600 mt-2 font-semibold">
                  Selected: Table {selectedTables.sort((a, b) => a - b).join(', ')}
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Rohit Acharya"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-base sm:text-lg"
                required
              />
            </div>

            {/* Number of People */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Number of People *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-base sm:text-lg"
                required
              />
            </div>

            {/* Split Bill Option */}
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-bold text-gray-700">Split Bill?</span>
                  <span className="block text-xs text-gray-500">We're happy to split your bill any way you like!</span>
                </div>
                <input
                  type="checkbox"
                  checked={splitBill}
                  onChange={(e) => {
                    setSplitBill(e.target.checked)
                    if (e.target.checked && splitPersons.length === 1) {
                      setSplitPersons([{name: '', amount: ''}, {name: '', amount: ''}])
                    }
                  }}
                  className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                />
              </label>

              {splitBill && (
                <div className="mt-4 space-y-4">
                  {/* Split Type Selection */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitType('equal')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'equal'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Split Equally
                    </button>
                    <button
                      onClick={() => setSplitType('unequal')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                        splitType === 'unequal'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Split Custom Amounts
                    </button>
                  </div>

                  {splitType === 'equal' ? (
                    /* Equal Split */
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Enter Names
                      </label>
                      {splitPersons.map((person, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateSplitPerson(index, 'name', e.target.value)}
                            placeholder={`Person ${index + 1} name`}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          />
                          {splitPersons.length > 1 && (
                            <button
                              onClick={() => removeSplitPerson(index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addSplitPerson}
                        className="w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold text-sm mt-2"
                      >
                        + Add Person
                      </button>
                      <p className="text-xs text-green-600 mt-2 font-semibold">
                        ✨ Bill will be split equally between everyone
                      </p>
                    </div>
                  ) : (
                    /* Unequal Split */
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Enter Names & Custom Amounts
                      </label>
                      <p className="text-xs text-gray-600 mb-3">Perfect for when people order different amounts!</p>
                      {splitPersons.map((person, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateSplitPerson(index, 'name', e.target.value)}
                            placeholder="Name"
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                          />
                          <input
                            type="number"
                            value={person.amount}
                            onChange={(e) => updateSplitPerson(index, 'amount', e.target.value)}
                            placeholder="¥ Amount"
                            className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                          />
                          {splitPersons.length > 1 && (
                            <button
                              onClick={() => removeSplitPerson(index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addSplitPerson}
                        className="w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold text-sm mt-2"
                      >
                        + Add Person
                      </button>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Tip:</strong> Custom amounts let you split based on what each person ordered. You can adjust these amounts anytime!
                        </p>
                      </div>
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

  // Order confirmation screen
  if (orderSubmitted) {
    const validSplitPersons = splitBill ? splitPersons.filter(p => p.name.trim() !== '') : []
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 max-w-md shadow-2xl">
          <div className="text-8xl mb-6">✨</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-lg text-gray-700 mb-4">Your order has been sent to our kitchen</p>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 font-semibold">
              We truly appreciate your visit and can't wait to serve you delicious food! Your satisfaction means everything to us. 🙏
            </p>
          </div>

          <div className="space-y-2 text-gray-700 mb-6">
            <p className="text-2xl font-bold text-green-600">Table {selectedTables.join(', ')}</p>
            <p className="text-lg">{customerName}</p>
            <p className="text-sm text-gray-500">{numberOfPeople} {parseInt(numberOfPeople) === 1 ? 'person' : 'people'}</p>
            {splitBill && validSplitPersons.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-2">Bill Split Details</p>
                <div className="text-xs text-blue-800 space-y-1">
                  {splitType === 'equal' ? (
                    validSplitPersons.map((person, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{person.name}</span>
                        <span className="font-bold">{formatPrice(getCartTotal() / validSplitPersons.length)}</span>
                      </div>
                    ))
                  ) : (
                    validSplitPersons.map((person, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{person.name}</span>
                        <span className="font-bold">{formatPrice(parseFloat(person.amount) || 0)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
            <p className="text-xs text-orange-800">
              ⏱️ Your fresh, delicious meal will be ready shortly. Thank you for your patience!
            </p>
          </div>
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
              <h1 className="text-xl sm:text-2xl font-bold">Table {selectedTables.join(', ')}</h1>
              <p className="text-green-100 text-xs sm:text-sm">{customerName} • {numberOfPeople} {parseInt(numberOfPeople) === 1 ? 'person' : 'people'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">{formatPrice(getCartTotal())}</div>
              <div className="text-xs sm:text-sm text-green-100">{getCartCount()} items</div>
              {splitBill && splitPersons.filter(p => p.name.trim() !== '').length > 0 && (
                <div className="text-xs text-green-200 mt-1">
                  {splitType === 'equal'
                    ? `${formatPrice(getCartTotal() / splitPersons.filter(p => p.name.trim() !== '').length)} per person`
                    : 'Custom split amounts'
                  }
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
                  {/* Image - Better display with object-cover */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={imagePath}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, 112px"
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

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
      }
      return newCart
    })
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
          subtotal: (item?.price || 0) * quantity
        }
      })

      const { data, error } = await supabase
        .from('table_orders')
        .insert({
          table_number: parseInt(tableNumber),
          items: orderItems,
          total_amount: getCartTotal(),
          status: 'pending'
        })
        .select()

      if (error) throw error

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

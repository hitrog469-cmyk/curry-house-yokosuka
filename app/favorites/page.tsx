'use client'

import { useState, useEffect } from 'react'
import { menuItems } from '@/lib/menu-data'
import { getMenuItemImage } from '@/lib/image-mapping'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import Image from 'next/image'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    // Load recent orders from localStorage (simplified - in production this would come from DB)
    const savedRecentOrders = localStorage.getItem('recentOrders')
    if (savedRecentOrders) {
      setRecentOrders(JSON.parse(savedRecentOrders))
    }

    setLoading(false)
  }, [])

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      localStorage.setItem('favorites', JSON.stringify(updated))
      return updated
    })
  }

  const addToCart = (itemId: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}')
    cart[itemId] = (cart[itemId] || 0) + 1
    localStorage.setItem('cart', JSON.stringify(cart))
    // Trigger storage event for cart count update in navbar
    window.dispatchEvent(new Event('storage'))
    alert('Added to cart!')
  }

  const addAllToCart = (items: { id: string, quantity: number }[]) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}')
    items.forEach(item => {
      cart[item.id] = (cart[item.id] || 0) + item.quantity
    })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
    alert('All items added to cart!')
  }

  const favoriteItems = menuItems.filter(item => favorites.includes(item.id))

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white pt-20 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-black mb-2">Your Favorites</h1>
          <p className="text-rose-100">Quick access to your favorite dishes & past orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Favorites Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-stone-800">❤️ Favorite Dishes</h2>
              <p className="text-stone-500 text-sm">Tap the heart on any menu item to save it here</p>
            </div>
            {favoriteItems.length > 0 && (
              <button
                onClick={() => addAllToCart(favoriteItems.map(item => ({ id: item.id, quantity: 1 })))}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                Add All to Cart
              </button>
            )}
          </div>

          {favoriteItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
              <div className="text-5xl mb-4">💔</div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">No Favorites Yet</h3>
              <p className="text-stone-500 mb-6">
                Browse our menu and tap the heart icon to save your favorite dishes!
              </p>
              <Link
                href="/menu"
                className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteItems.map(item => {
                const image = getMenuItemImage(item.id)
                return (
                  <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all">
                    <div className="relative h-40 bg-gradient-to-br from-amber-50 to-orange-50">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.name}
                          fill
                          className="object-cover scale-[1.5]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">🍛</span>
                        </div>
                      )}
                      {/* Remove from favorites */}
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      >
                        <span className="text-red-500 text-xl">❤️</span>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-stone-800">{item.name}</h3>
                      <p className="text-stone-400 text-xs">{item.nameJp}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-black text-emerald-600">{formatPrice(item.price)}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Orders Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-stone-800">🕐 Order Again</h2>
              <p className="text-stone-500 text-sm">Quickly reorder from your past orders</p>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">No Recent Orders</h3>
              <p className="text-stone-500 mb-6">
                Your past orders will appear here for easy reordering.
              </p>
              <Link
                href="/menu"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Order Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-stone-400">{order.date}</p>
                      <p className="font-bold text-stone-800">{order.items.length} items • {formatPrice(order.total)}</p>
                    </div>
                    <button
                      onClick={() => addAllToCart(order.items)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Reorder All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 4).map((item: any, i: number) => {
                      const menuItem = menuItems.find(m => m.id === item.id)
                      return (
                        <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                          {menuItem?.name || item.name} x{item.quantity}
                        </span>
                      )
                    })}
                    {order.items.length > 4 && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link href="/menu" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🍽️
              </div>
              <div>
                <h3 className="font-bold text-lg">Browse Full Menu</h3>
                <p className="text-amber-100 text-sm">200+ dishes to explore</p>
              </div>
            </div>
          </Link>
          <Link href="/track" className="bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-2xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📍
              </div>
              <div>
                <h3 className="font-bold text-lg">Track Your Order</h3>
                <p className="text-sky-100 text-sm">Real-time status updates</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}

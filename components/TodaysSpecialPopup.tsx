'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTodaysSpecial, isSpecialValid, type DailySpecial } from '@/lib/daily-special-api'
import { getMenuItemImage } from '@/lib/image-mapping'
import { formatPrice } from '@/lib/utils'
import { menuItems } from '@/lib/menu-data'

interface TodaysSpecialPopupProps {
  forceShow?: boolean // Force show immediately (e.g., on QR scan)
}

// Fallback specials from menu when no DB special exists
// Rotates daily based on day of month
function getFallbackSpecial(): DailySpecial {
  const recommendedCurries = menuItems.filter(
    item => item.isRecommended && ['chicken_curry', 'mutton_curry', 'vegetable_curry', 'seafood_curry', 'special_curry', 'keema_curry'].includes(item.category)
  )

  // Pick one based on day of month for variety
  const now = new Date()
  const japanDay = parseInt(now.toLocaleDateString('en-US', { timeZone: 'Asia/Tokyo', day: 'numeric' }))
  const index = japanDay % recommendedCurries.length
  const item = recommendedCurries[index] || recommendedCurries[0]

  const discountPercent = 15
  const specialPrice = Math.round(item.price * (1 - discountPercent / 100))
  const japanDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })

  return {
    id: `fallback-${item.id}`,
    menu_item_id: item.id,
    menu_item_name: item.name,
    original_price: item.price,
    special_price: specialPrice,
    discount_percentage: discountPercent,
    display_text: item.description || `Today's featured dish — ${item.nameJp}`,
    is_active: true,
    valid_date: japanDate,
    valid_from: '11:00',
    valid_until: '22:00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export default function TodaysSpecialPopup({ forceShow = false }: TodaysSpecialPopupProps) {
  const [special, setSpecial] = useState<DailySpecial | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)
  const searchParams = useSearchParams()

  // Check if coming from QR code scan
  const isFromQR = searchParams?.get('table') !== null || forceShow

  useEffect(() => {
    // Check if user already dismissed today (but always show for QR scans)
    const dismissedDate = sessionStorage.getItem('special-dismissed')
    const today = new Date().toDateString()

    // Reset dismissal if coming from QR
    if (isFromQR) {
      sessionStorage.removeItem('special-dismissed')
    } else if (dismissedDate === today) {
      setDismissed(true)
      setLoading(false)
      return
    }

    async function loadSpecial() {
      try {
        // Try to fetch from database first
        const todaysSpecial = await getTodaysSpecial()
        if (todaysSpecial && isSpecialValid(todaysSpecial)) {
          setSpecial(todaysSpecial)
        } else {
          // No DB special found — use fallback from menu
          setSpecial(getFallbackSpecial())
        }
        // Show popup after a short delay
        setTimeout(() => setVisible(true), isFromQR ? 500 : 1500)
      } catch (error) {
        console.error('Error loading today\'s special:', error)
        // Even on error, show fallback
        setSpecial(getFallbackSpecial())
        setTimeout(() => setVisible(true), isFromQR ? 500 : 1500)
      } finally {
        setLoading(false)
      }
    }

    loadSpecial()
  }, [isFromQR])

  const handleDismiss = () => {
    setVisible(false)
    // Wait for animation to finish before fully dismissing
    setTimeout(() => {
      setDismissed(true)
      sessionStorage.setItem('special-dismissed', new Date().toDateString())
    }, 300)
  }

  if (loading || !special || dismissed) return null

  const imagePath = getMenuItemImage(special.menu_item_id) || '/images/placeholder-dish.jpg'

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          onClick={handleDismiss}
        />
      )}

      {/* Popup */}
      {visible && (
        <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto animate-scaleIn"
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative h-40 sm:h-52 overflow-hidden">
              <Image
                src={imagePath}
                alt={special.menu_item_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
                priority
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

              {/* Discount badge */}
              <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-full font-black text-sm shadow-lg">
                {special.discount_percentage}% OFF
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{background: 'rgba(93,183,97,0.1)', color: '#3E7B41'}}>
                <span>🌟</span>
                <span>Today&apos;s Special</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {special.menu_item_name}
              </h2>

              {/* Description */}
              <p className="text-gray-500 text-sm mb-4">{special.display_text}</p>

              {/* Pricing Row */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-400 line-through text-lg">
                  {formatPrice(special.original_price)}
                </span>
                <span className="text-3xl font-black" style={{color: '#5DB761'}}>
                  {formatPrice(special.special_price)}
                </span>
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background: 'rgba(93,183,97,0.1)', color: '#3E7B41'}}>
                  Save {formatPrice(special.original_price - special.special_price)}
                </span>
              </div>

              {/* Time */}
              <p className="text-xs text-gray-400 mb-4">
                ⏰ Available {special.valid_from} - {special.valid_until}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/table-order?special=${special.menu_item_id}`}
                  onClick={handleDismiss}
                  className="flex-1 text-center text-white font-bold py-3 rounded-xl transition-all text-sm shadow-md hover:shadow-lg"
                  style={{background: 'linear-gradient(135deg, #5DB761, #4AA64E)'}}
                >
                  Order In-House →
                </Link>
                <Link
                  href={`/order?special=${special.menu_item_id}`}
                  onClick={handleDismiss}
                  className="flex-1 text-center font-bold py-3 rounded-xl transition-all text-sm border-2"
                  style={{borderColor: '#5DB761', color: '#3E7B41'}}
                >
                  Delivery →
                </Link>
              </div>

              {/* Fine print */}
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                Limited time offer. While supplies last.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mini floating badge - shows after dismiss so users can re-open */}
      {dismissed && special && (
        <button
          onClick={() => { setDismissed(false); setVisible(true) }}
          className="fixed bottom-24 right-4 z-40 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all animate-fadeIn flex items-center gap-2"
          style={{background: 'linear-gradient(135deg, #5DB761, #4AA64E)'}}
        >
          <span>🌟</span>
          <span>Today&apos;s Special</span>
        </button>
      )}
    </>
  )
}

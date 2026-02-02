'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTodaysSpecial, isSpecialValid, type DailySpecial } from '@/lib/daily-special-api'
import { getMenuItemImage } from '@/lib/image-mapping'
import { formatPrice } from '@/lib/utils'

export default function TodaysSpecial() {
  const [special, setSpecial] = useState<DailySpecial | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSpecial() {
      try {
        const todaysSpecial = await getTodaysSpecial()
        if (todaysSpecial && isSpecialValid(todaysSpecial)) {
          setSpecial(todaysSpecial)
        }
      } catch (error) {
        console.error('Error loading today\'s special:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSpecial()
  }, [])

  if (loading || !special) return null

  const imagePath = getMenuItemImage(special.menu_item_id) || '/images/placeholder-dish.jpg'

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 py-12">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Image */}
          <div className="relative w-full md:w-1/2 h-64 md:h-80 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={imagePath}
              alt={special.menu_item_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge */}
            <div className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-bold mb-4">
              🌟 Today's Special
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              {special.menu_item_name}
            </h2>

            {/* Display Text */}
            <p className="text-gray-600 mb-4">{special.display_text}</p>

            {/* Pricing */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="text-2xl text-gray-400 line-through">
                {formatPrice(special.original_price)}
              </span>
              <span className="text-4xl md:text-5xl font-black text-green-600">
                {formatPrice(special.special_price)}
              </span>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm md:text-base">
                {special.discount_percentage}% OFF
              </span>
            </div>

            {/* Time validity */}
            <p className="text-sm text-gray-500 mb-6">
              ⏰ Available {special.valid_from} - {special.valid_until}
            </p>

            {/* Savings Badge */}
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold mb-6">
              💰 Save {formatPrice(special.original_price - special.special_price)}!
            </div>

            {/* Order Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/table-order?special=${special.menu_item_id}`}
                className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg text-center"
              >
                Order In-House →
              </Link>
              <Link
                href={`/order?special=${special.menu_item_id}`}
                className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg text-center"
              >
                Order Delivery →
              </Link>
            </div>

            {/* Limited Time Notice */}
            <p className="text-xs text-gray-500 mt-4 text-center md:text-left">
              * Limited time offer. While supplies last. Price reflects today's special discount.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

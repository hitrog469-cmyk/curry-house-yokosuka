'use client'

import { useState } from 'react'

export default function TopBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-2.5 relative">
          {/* Scrolling content */}
          <div className="overflow-hidden flex-1">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                🔥 FREE DELIVERY on all orders!
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                🌟 Check out Today&apos;s Special — Limited Time!
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                🎉 Use code WELCOME15 for 15% OFF
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                📍 Yokosuka&apos;s Finest Indian, Mexican, Nepalese & Japanese-Fusion
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                🔥 FREE DELIVERY on all orders!
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                🌟 Check out Today&apos;s Special — Limited Time!
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                🎉 Use code WELCOME15 for 15% OFF
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
